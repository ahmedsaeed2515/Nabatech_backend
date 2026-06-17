"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const db_setup_1 = require("./db.setup");
const ai_orchestrator_service_1 = require("../services/ai/ai_orchestrator_service");
// 2. Mock Orchestrator
jest.mock("../services/ai/ai_orchestrator_service", () => ({
    orchestrateAssistantRequest: jest.fn(),
}));
// Mock cloudinary destroy
const mockDestroy = jest.fn().mockResolvedValue({ result: "ok" });
jest.mock("../config/cloudinary", () => {
    const mockCloudinaryObj = {
        uploader: {
            upload_stream: (options, callback) => {
                return {
                    end: (buffer) => {
                        callback(null, {
                            secure_url: "https://res.cloudinary.com/nabatech-mock/image/upload/v123456/test_diagnosis.jpg",
                            public_id: "test_diagnosis_public_id",
                        });
                    }
                };
            },
            destroy: (...args) => mockDestroy(...args)
        }
    };
    return {
        __esModule: true,
        default: mockCloudinaryObj,
        uploader: mockCloudinaryObj.uploader
    };
});
const mockedOrchestrateAssistantRequest = ai_orchestrator_service_1.orchestrateAssistantRequest;
beforeAll(async () => {
    await (0, db_setup_1.connectTestDB)();
});
afterAll(async () => {
    await (0, db_setup_1.disconnectTestDB)();
});
beforeEach(async () => {
    await (0, db_setup_1.clearTestDB)();
    jest.clearAllMocks();
});
describe("Diagnosis Predict API Endpoints", () => {
    let userToken;
    let userId;
    beforeEach(async () => {
        const userRes = await (0, supertest_1.default)(app_1.default)
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
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/diagnosis/predict")
                .attach("file", Buffer.from("dummy-image-data"), "plant.jpg");
            expect(res.status).toBe(401);
            expect(res.body.message).toContain("Not authorized");
        });
        it("should fail if no file is uploaded in the request", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/diagnosis/predict")
                .set("Authorization", `Bearer ${userToken}`)
                .field("dummy", "value"); // ensure multipart
            expect(res.status).toBe(400);
            expect(res.body.message).toContain("No file uploaded");
        });
        it("returns prediction, confidence, advice and saves to history with candidates", async () => {
            mockedOrchestrateAssistantRequest.mockResolvedValueOnce({
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
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/diagnosis/predict")
                .set("Authorization", `Bearer ${userToken}`)
                .attach("file", fakeImageBuffer, "leaves.jpg");
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.prediction).toBe("powdery mildew");
            expect(res.body.confidence).toBe(0.95);
            expect(res.body.advice).toBe("This disease can be treated by neem oil.");
            expect(res.body.candidates.length).toBe(1);
            expect(res.body.historyId).toBeDefined();
            const dbHistory = await diagnosis_history_model_1.default.findOne({ user: userId });
            expect(dbHistory).not.toBeNull();
            expect(dbHistory?.diseaseNameEn).toBe("powdery mildew");
            expect(dbHistory?.diseaseNameAr).toBe("البياض الدقيقي");
            expect(dbHistory?.severity).toBe("high");
            expect(dbHistory?.candidates?.length).toBe(1);
            expect(dbHistory?.candidates?.[0].label).toBe("powdery mildew");
        });
        it("accepts optional plantId and links to history", async () => {
            mockedOrchestrateAssistantRequest.mockResolvedValueOnce({
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
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/diagnosis/predict")
                .set("Authorization", `Bearer ${userToken}`)
                .field("plantId", plantId)
                .attach("file", fakeImageBuffer, "leaves.jpg");
            expect(res.status).toBe(200);
            const dbHistory = await diagnosis_history_model_1.default.findOne({ user: userId });
            expect(dbHistory?.plantId?.toString()).toBe(plantId);
        });
        it("returns lowConfidenceWarning when confidence is low", async () => {
            mockedOrchestrateAssistantRequest.mockResolvedValueOnce({
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
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/diagnosis/predict")
                .set("Authorization", `Bearer ${userToken}`)
                .attach("file", fakeImageBuffer, "leaves.jpg");
            expect(res.status).toBe(200);
            expect(res.body.lowConfidenceWarning).toBe("Low CNN confidence");
            expect(res.body.needsNewImage).toBe(true);
        });
        it("returns idempotent response for same clientOperationId", async () => {
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
            const clientOpId = "idemp-op-123";
            const res1 = await (0, supertest_1.default)(app_1.default)
                .post("/api/diagnosis/predict")
                .set("Authorization", `Bearer ${userToken}`)
                .field("clientOperationId", clientOpId)
                .attach("file", fakeImageBuffer, "leaves.jpg");
            expect(res1.status).toBe(200);
            const res2 = await (0, supertest_1.default)(app_1.default)
                .post("/api/diagnosis/predict")
                .set("Authorization", `Bearer ${userToken}`)
                .field("clientOperationId", clientOpId)
                .attach("file", fakeImageBuffer, "leaves.jpg");
            expect(res2.status).toBe(200);
            expect(res2.body.historyId).toBe(res1.body.historyId);
            const historyCount = await diagnosis_history_model_1.default.countDocuments({ clientOperationId: clientOpId });
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
            const createSpy = jest.spyOn(diagnosis_history_model_1.default, "create").mockRejectedValueOnce(new Error("DB Error"));
            const res = await (0, supertest_1.default)(app_1.default)
                .post("/api/diagnosis/predict")
                .set("Authorization", `Bearer ${userToken}`)
                .attach("file", fakeImageBuffer, "leaves.jpg");
            expect(res.status).toBe(500);
            expect(mockDestroy).toHaveBeenCalledWith("test_diagnosis_public_id");
            createSpy.mockRestore();
        });
    });
    describe("POST /api/diagnosis/sync-offline", () => {
        it("creates an isOffline=true DiagnosisHistory record", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
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
            const dbHistory = await diagnosis_history_model_1.default.findById(res.body.id);
            expect(dbHistory).not.toBeNull();
            expect(dbHistory?.isOffline).toBe(true);
            expect(dbHistory?.diseaseNameEn).toBe("wheat rust");
            expect(dbHistory?.diseaseNameAr).toBe("صدأ الحنطة"); // Auto-translated
            expect(dbHistory?.imageUrl).toBe("https://example.com/path.jpg");
        });
        it("returns 400 if diseaseNameEn missing", async () => {
            const res = await (0, supertest_1.default)(app_1.default)
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
            const res = await (0, supertest_1.default)(app_1.default)
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
            const dbHistory = await diagnosis_history_model_1.default.findById(res.body.id);
            expect(dbHistory?.diagnosedAt.toISOString()).toBe(pastDate.toISOString());
        });
    });
});
