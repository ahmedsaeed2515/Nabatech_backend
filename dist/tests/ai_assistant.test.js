"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const db_setup_1 = require("./db.setup");
const auth_helper_1 = require("./helpers/auth.helper");
jest.mock("../services/ai/ai_orchestrator_service", () => ({
    orchestrateAssistantRequest: jest.fn(),
}));
jest.mock("../config/cloudinary", () => ({
    __esModule: true,
    default: {
        uploader: {
            upload_stream: (_options, callback) => ({
                end: () => callback(null, { secure_url: "https://cloudinary.test/assistant.jpg" }),
            }),
        },
    },
}));
jest.mock("../models/diagnosis_history_model", () => ({
    __esModule: true,
    default: { create: jest.fn() },
}));
const ai_orchestrator_service_1 = require("../services/ai/ai_orchestrator_service");
const mockedOrchestrateAssistantRequest = ai_orchestrator_service_1.orchestrateAssistantRequest;
jest.setTimeout(120000);
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
describe("Unified AI assistant route", () => {
    it("text-only request uses chat mode", async () => {
        const user = await (0, auth_helper_1.createTestUser)();
        const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
        mockedOrchestrateAssistantRequest.mockResolvedValue({
            mode: "chat",
            message: "answer",
            source: "rag",
            provider: "rag",
            providerChain: ["rag"],
            lowConfidenceWarning: "",
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/api/ai/assistant")
            .set("Authorization", `Bearer ${token}`)
            .field("text", "hello");
        expect(res.status).toBe(200);
        expect(res.body.mode).toBe("chat");
        expect(mockedOrchestrateAssistantRequest).toHaveBeenCalled();
    });
    it("image + question request returns image_chat mode", async () => {
        const user = await (0, auth_helper_1.createTestUser)();
        const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
        mockedOrchestrateAssistantRequest.mockResolvedValue({
            mode: "image_chat",
            diagnosis: { prediction: "powdery mildew", confidence: 0.8, candidates: [], provider: "cnn" },
            message: "care tips",
            source: "fallback",
            provider: "openai",
            providerChain: ["cnn", "openai"],
            lowConfidenceWarning: "",
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/api/ai/assistant")
            .set("Authorization", `Bearer ${token}`)
            .field("text", "what should I do?")
            .attach("file", Buffer.from("img"), "leaf.jpg");
        expect(res.status).toBe(200);
        expect(res.body.mode).toBe("image_chat");
        expect(mockedOrchestrateAssistantRequest).toHaveBeenCalled();
    });
});
