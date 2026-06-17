"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const message_model_1 = __importDefault(require("../models/message_model"));
const db_setup_1 = require("./db.setup");
const auth_helper_1 = require("./helpers/auth.helper");
jest.mock("../services/ai/ai_orchestrator_service", () => ({
    orchestrateChat: jest.fn(),
}));
const ai_orchestrator_service_1 = require("../services/ai/ai_orchestrator_service");
const mockedOrchestrateChat = ai_orchestrator_service_1.orchestrateChat;
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
describe("Chat API with orchestrator", () => {
    it("uses orchestrator and persists user+llm messages", async () => {
        const user = await (0, auth_helper_1.createTestUser)();
        const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
        mockedOrchestrateChat.mockResolvedValue({
            message: "answer from rag",
            source: "rag",
            provider: "rag",
        });
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/api/chat")
            .set("Authorization", `Bearer ${token}`)
            .send({ text: "hello", history: [], top_k: 8 });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe("answer from rag");
        expect(res.body.source).toBe("rag");
        const messages = await message_model_1.default.find();
        expect(messages.length).toBe(2);
    });
    it("returns 502 safe payload when orchestrator fails", async () => {
        const user = await (0, auth_helper_1.createTestUser)();
        const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
        mockedOrchestrateChat.mockRejectedValue(new Error("upstream failed"));
        const res = await (0, supertest_1.default)(app_1.default)
            .post("/api/chat")
            .set("Authorization", `Bearer ${token}`)
            .send({ text: "hello" });
        expect(res.status).toBe(502);
        expect(res.body.success).toBe(false);
        expect(res.body.message).toContain("Chat failed");
    });
});
