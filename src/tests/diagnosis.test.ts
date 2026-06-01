import request from "supertest";
import axios from "axios";
import app from "../app";
import DiagnosisHistory from "../models/diagnosis_history_model";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./db.setup";

// 1. Hoisted-safe Cloudinary mock defined entirely inside the mock callback to prevent initialization errors
jest.mock("../config/cloudinary", () => {
  const mockCloudinaryObj = {
    uploader: {
      upload_stream: (options: any, callback: any) => {
        return {
          end: (buffer: any) => {
            callback(null, {
              secure_url: "https://res.cloudinary.com/nabatech-mock/image/upload/v123456/test_diagnosis.jpg"
            });
          }
        };
      }
    }
  };
  return {
    __esModule: true,
    default: mockCloudinaryObj,
    uploader: mockCloudinaryObj.uploader
  };
});

// 2. Mock Axios for external CNN space predictions
jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  jest.clearAllMocks();
  process.env.CNN_ENDPOINT_URL = "https://mock-cnn.local/predict";
});

describe("Diagnosis Predict API Endpoints", () => {
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    // Register a test user
    const userRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Gardener Ahmad",
        email: "gardener.ahmad@example.com",
        password: "Password123"
      });
    userToken = userRes.body.token;
    userId = userRes.body.user.id;
  });

  describe("POST /api/diagnosis/predict", () => {
    it("should reject request if no token is provided", async () => {
      const res = await request(app)
        .post("/api/diagnosis/predict")
        .attach("file", Buffer.from("dummy-image-data"), "plant.jpg");

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Not authorized");
    });

    it("should fail if no file is uploaded in the request", async () => {
      const res = await request(app)
        .post("/api/diagnosis/predict")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("No file uploaded");
    });

    it("should successfully upload to Cloudinary, proxy to CNN space, and save diagnosis to DB history", async () => {
      // Mock the CNN Space server response with casting to any to bypass strict TS typing limits in test mocks
      mockedAxios.post.mockResolvedValueOnce({
        status: 200,
        data: {
          prediction: "powdery mildew",
          confidence: 0.95
        }
      } as any);

      const fakeImageBuffer = Buffer.from("this is a fake jpeg image buffer");

      const res = await request(app)
        .post("/api/diagnosis/predict")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("file", fakeImageBuffer, "leaves.jpg");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.prediction).toBe("powdery mildew");
      expect(res.body.confidence).toBe(0.95);
      expect(res.body.imageUrl).toContain("test_diagnosis.jpg");

      // Verify saving in MongoDB
      const dbHistory = await DiagnosisHistory.findOne({ user: userId });
      expect(dbHistory).not.toBeNull();
      expect(dbHistory?.diseaseNameEn).toBe("powdery mildew");
      expect(dbHistory?.diseaseNameAr).toBe("البياض الدقيقي"); // Arabic translation dictionary test
      expect(dbHistory?.severity).toBe("high"); // Severity calculation logic check
      expect(dbHistory?.imageUrl).toBe(res.body.imageUrl);
    });

    it("should return safe error payload if CNN provider request fails", async () => {
      // Mock axios post failure
      mockedAxios.post.mockRejectedValueOnce(new Error("Remote Server Timeout"));

      const fakeImageBuffer = Buffer.from("this is a fake jpeg image buffer");

      const res = await request(app)
        .post("/api/diagnosis/predict")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("file", fakeImageBuffer, "leaves.jpg");

      expect(res.status).toBe(502);
      expect(res.body.message).toContain("Inference failed");
    });
  });
});
