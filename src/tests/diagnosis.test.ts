import request from "supertest";
import app from "../app";
import DiagnosisHistory from "../models/diagnosis_history_model";
import { connectTestDB, disconnectTestDB, clearTestDB } from "./db.setup";
import { orchestrateAssistantRequest } from "../services/ai/ai_orchestrator_service";

// 2. Mock Orchestrator
jest.mock("../services/ai/ai_orchestrator_service", () => ({
  orchestrateAssistantRequest: jest.fn(),
}));

// Mock cloudinary destroy
const mockDestroy = jest.fn().mockResolvedValue({ result: "ok" });
jest.mock("../config/cloudinary", () => {
  const mockCloudinaryObj = {
    uploader: {
      upload_stream: (options: any, callback: any) => {
        return {
          end: (buffer: any) => {
            callback(null, {
              secure_url: "https://res.cloudinary.com/nabatech-mock/image/upload/v123456/test_diagnosis.jpg",
              public_id: "test_diagnosis_public_id",
            });
          }
        };
      },
      destroy: (...args: any[]) => mockDestroy(...args)
    }
  };
  return {
    __esModule: true,
    default: mockCloudinaryObj,
    uploader: mockCloudinaryObj.uploader
  };
});

const mockedOrchestrateAssistantRequest = orchestrateAssistantRequest as jest.MockedFunction<typeof orchestrateAssistantRequest>;

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
  jest.clearAllMocks();
});

describe("Diagnosis Predict API Endpoints (Migrated to AI Assistant)", () => {
  let userToken: string;
  let userId: string;

  beforeEach(async () => {
    const userRes = await request(app)
      .post("/api/auth/register")
      .send({
        name: "Gardener Ahmad",
        email: "gardener.ahmad@example.com",
        password: "Password123"
      });
    userToken = userRes.body.token;
    userId = userRes.body.user.id;

    const { DiseaseKnowledgeRecord } = require("../models/disease_knowledge_record_model");
    await DiseaseKnowledgeRecord.create({
      diseaseNameEn: "powdery mildew",
      diseaseNameAr: "البياض الدقيقي",
      severity: "high",
      advice: "Use neem oil",
    });
    await DiseaseKnowledgeRecord.create({
      diseaseNameEn: "wheat rust",
      diseaseNameAr: "صدأ الحنطة",
      severity: "high",
      advice: "Use fungicides",
    });
  });

  describe("POST /api/ai/assistant", () => {
    it("should reject request if no token is provided", async () => {
      const res = await request(app)
        .post("/api/ai/assistant")
        .attach("file", Buffer.from("dummy-image-data"), "plant.jpg");

      expect(res.status).toBe(401);
      expect(res.body.message).toContain("Not authorized");
    });

    it("should fail if no file is uploaded in the request", async () => {
      const res = await request(app)
        .post("/api/ai/assistant")
        .set("Authorization", `Bearer ${userToken}`)
        .field("dummy", "value"); // ensure multipart

      expect(res.status).toBe(400);
      expect(res.body.message).toContain("No file uploaded");
    });

    it("returns prediction, confidence, advice and saves to history with candidates", async () => {
      mockedOrchestrateAssistantRequest.mockResolvedValue({
        mode: "image_chat",
        diagnosis: {
          prediction: "powdery mildew",
          confidence: 0.95,
          candidates: [{ label: "powdery mildew", confidence: 0.95 }],
          provider: "cnn",
        },
        message: "This disease can be treated by neem oil.",
        source: "rag",
        provider: "groq",
        lowConfidenceWarning: "",
        needsNewImage: false,
        recommendedAction: undefined,
        providerChain: ["cnn", "rag"],
      });

      const fakeImageBuffer = Buffer.from("this is a fake jpeg image buffer");

      const res = await request(app)
        .post("/api/ai/assistant")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("file", fakeImageBuffer, "leaves.jpg");

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.diagnosis.prediction).toBe("powdery mildew");
      expect(res.body.diagnosis.confidence).toBe(0.95);
      expect(res.body.message).toBe("This disease can be treated by neem oil.");
      expect(res.body.diagnosis.candidates.length).toBe(1);
      expect(res.body.historyId).toBeDefined();

      const dbHistory = await DiagnosisHistory.findOne({ user: userId });
      expect(dbHistory).not.toBeNull();
      expect(dbHistory?.diseaseNameEn).toBe("powdery mildew");
      expect(dbHistory?.diseaseNameAr).toBe("البياض الدقيقي");
      expect(dbHistory?.severity).toBe("high");
      expect(dbHistory?.candidates?.length).toBe(1);
      expect(dbHistory?.candidates?.[0].label).toBe("powdery mildew");
    });

    it("accepts optional plantId and links to history", async () => {
      mockedOrchestrateAssistantRequest.mockResolvedValue({
        mode: "image_chat",
        diagnosis: {
          prediction: "healthy",
          confidence: 0.99,
          candidates: [],
          provider: "cnn",
        },
        message: "Your plant is healthy.",
        source: "cnn",
        provider: "cnn",
        lowConfidenceWarning: "",
        needsNewImage: false,
        recommendedAction: undefined,
        providerChain: ["cnn"],
      });

      const fakeImageBuffer = Buffer.from("this is a fake jpeg image buffer");
      const plantId = "60c72b2f9b1d8b001c8e4b5a"; // Random valid ObjectId

      const res = await request(app)
        .post("/api/ai/assistant")
        .set("Authorization", `Bearer ${userToken}`)
        .field("plantId", plantId)
        .attach("file", fakeImageBuffer, "leaves.jpg");

      expect(res.status).toBe(200);
      
      const dbHistory = await DiagnosisHistory.findOne({ user: userId });
      expect(dbHistory?.plantId?.toString()).toBe(plantId);
    });

    it("returns lowConfidenceWarning when confidence is low", async () => {
      mockedOrchestrateAssistantRequest.mockResolvedValue({
        mode: "image_chat",
        diagnosis: { prediction: "unknown", confidence: 0.2, candidates: [], provider: "cnn" },
        message: "Please upload a clearer image.",
        source: "cnn",
        provider: "cnn",
        lowConfidenceWarning: "Low CNN confidence",
        needsNewImage: true,
        recommendedAction: "upload_clearer_image",
        providerChain: ["cnn"],
      });

      const fakeImageBuffer = Buffer.from("this is a fake jpeg image buffer");

      const res = await request(app)
        .post("/api/ai/assistant")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("file", fakeImageBuffer, "leaves.jpg");

      expect(res.status).toBe(200);
      expect(res.body.lowConfidenceWarning).toBe("Low CNN confidence");
      expect(res.body.needsNewImage).toBe(true);
    });
    it("returns idempotent response for same clientOperationId", async () => {
      mockedOrchestrateAssistantRequest.mockResolvedValue({
        mode: "image_chat",
        diagnosis: { prediction: "healthy", confidence: 0.99, candidates: [], provider: "cnn" },
        message: "Your plant is healthy.",
        source: "cnn",
        provider: "cnn",
        lowConfidenceWarning: "",
        needsNewImage: false,
        recommendedAction: undefined,
        providerChain: ["cnn"],
      });

      const fakeImageBuffer = Buffer.from("this is a fake jpeg image buffer");
      const clientOpId = "idemp-op-123";

      const res1 = await request(app)
        .post("/api/ai/assistant")
        .set("Authorization", `Bearer ${userToken}`)
        .field("clientOperationId", clientOpId)
        .attach("file", fakeImageBuffer, "leaves.jpg");

      expect(res1.status).toBe(200);

      const res2 = await request(app)
        .post("/api/ai/assistant")
        .set("Authorization", `Bearer ${userToken}`)
        .field("clientOperationId", clientOpId)
        .attach("file", fakeImageBuffer, "leaves.jpg");

      expect(res2.status).toBe(200);
      expect(res2.body.historyId).toBe(res1.body.historyId);
      
      const historyCount = await DiagnosisHistory.countDocuments({ clientOperationId: clientOpId });
      expect(historyCount).toBe(1);
    });

    it("cleans up Cloudinary if DB save fails", async () => {
      mockedOrchestrateAssistantRequest.mockResolvedValueOnce({
        mode: "image_chat",
        diagnosis: { prediction: "healthy", confidence: 0.99, candidates: [], provider: "cnn" },
        message: "Your plant is healthy.",
        source: "cnn",
        provider: "cnn",
        lowConfidenceWarning: "",
        needsNewImage: false,
        recommendedAction: undefined,
        providerChain: ["cnn"],
      });

      const fakeImageBuffer = Buffer.from("this is a fake jpeg image buffer");

      // Force DB to fail
      const createSpy = jest.spyOn(DiagnosisHistory, "create").mockRejectedValueOnce(new Error("DB Error"));

      const res = await request(app)
        .post("/api/ai/assistant")
        .set("Authorization", `Bearer ${userToken}`)
        .attach("file", fakeImageBuffer, "leaves.jpg");

      expect(res.status).toBe(500);
      expect(mockDestroy).toHaveBeenCalledWith("test_diagnosis_public_id");
      createSpy.mockRestore();
    });
  });

  describe("POST /api/diagnosis/sync-offline", () => {
    it("creates an isOffline=true DiagnosisHistory record", async () => {
      const res = await request(app)
        .post("/api/diagnosis/sync-offline")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          diseaseNameEn: "wheat rust",
          confidence: 0.88,
          imageUrl: "https://example.com/path.jpg",
          clientOperationId: "test-op-1"
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.id).toBeDefined();

      const dbHistory = await DiagnosisHistory.findById(res.body.id);
      expect(dbHistory).not.toBeNull();
      expect(dbHistory?.isOffline).toBe(true);
      expect(dbHistory?.diseaseNameEn).toBe("wheat rust");
      expect(dbHistory?.diseaseNameAr).toBe("صدأ الحنطة"); // Auto-translated
      expect(dbHistory?.imageUrl).toBe("https://example.com/path.jpg");
    });

    it("returns 400 if diseaseNameEn missing", async () => {
      const res = await request(app)
        .post("/api/diagnosis/sync-offline")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          confidence: 0.88,
          imageUrl: "https://example.com/path.jpg",
          clientOperationId: "test-op-2"
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("uses provided diagnosedAt timestamp", async () => {
      const pastDate = new Date("2023-01-01T10:00:00Z");
      const res = await request(app)
        .post("/api/diagnosis/sync-offline")
        .set("Authorization", `Bearer ${userToken}`)
        .send({
          diseaseNameEn: "healthy",
          confidence: 0.99,
          imageUrl: "https://example.com/path.jpg",
          diagnosedAt: pastDate.toISOString(),
          clientOperationId: "test-op-3"
        });

      expect(res.status).toBe(201);
      const dbHistory = await DiagnosisHistory.findById(res.body.id);
      expect(dbHistory?.diagnosedAt.toISOString()).toBe(pastDate.toISOString());
    });
  });
});


