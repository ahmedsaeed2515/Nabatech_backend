"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../app"));
const ai_call_log_model_1 = __importDefault(require("../models/ai_call_log_model"));
const db_setup_1 = require("./db.setup");
const auth_helper_1 = require("./helpers/auth.helper");
beforeAll(async () => {
    await (0, db_setup_1.connectTestDB)();
});
afterAll(async () => {
    await (0, db_setup_1.disconnectTestDB)();
});
beforeEach(async () => {
    await (0, db_setup_1.clearTestDB)();
});
describe("AI Settings admin endpoints", () => {
    it("non-admin cannot access settings", async () => {
        const user = await (0, auth_helper_1.createTestUser)();
        const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/admin/ai-settings")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(403);
    });
    it("admin reads redacted settings only", async () => {
        const admin = await (0, auth_helper_1.createAdminUser)();
        const token = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/admin/ai-settings")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.llm.hasApiKey).toBeDefined();
        expect(res.body.data.llm.apiKey).toBeUndefined();
    });
    it("admin updates valid settings", async () => {
        const admin = await (0, auth_helper_1.createAdminUser)();
        const token = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
        const res = await (0, supertest_1.default)(app_1.default)
            .put("/api/admin/ai-settings")
            .set("Authorization", `Bearer ${token}`)
            .send({
            cnn: { enabled: true, provider: "hf", endpointUrl: "https://example.com/cnn", timeoutMs: 35000, inputSize: 224, preprocessRequired: false, confidenceThreshold: 0.4 },
            rag: { enabled: true, endpointUrl: "https://example.com/rag", timeoutMs: 20000, topK: 7 },
            llm: { enabled: true, provider: "openai", model: "gpt-4o-mini", timeoutMs: 25000, systemPrompt: "test" },
            fallback: { chatOrder: ["rag", "llm"], diagnosisOrder: ["cnn"] },
            features: { allowFlutterOfflineModel: true, allowBackendFallbackToLLM: true },
            pipeline: { imageFirst: true, answerAfterDiagnosis: true, allowAnswerIfCnnFails: false, lowConfidenceBehavior: "warn" },
        });
        expect(res.status).toBe(200);
        expect(res.body.data.rag.topK).toBe(7);
        expect(res.body.data.pipeline.imageFirst).toBe(true);
    });
    it("rejects invalid URL", async () => {
        const admin = await (0, auth_helper_1.createAdminUser)();
        const token = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
        const res = await (0, supertest_1.default)(app_1.default)
            .put("/api/admin/ai-settings")
            .set("Authorization", `Bearer ${token}`)
            .send({ rag: { enabled: true, endpointUrl: "javascript:alert(1)" } });
        expect(res.status).toBe(400);
    });
    it("rejects invalid numeric ranges", async () => {
        const admin = await (0, auth_helper_1.createAdminUser)();
        const token = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
        const res = await (0, supertest_1.default)(app_1.default)
            .put("/api/admin/ai-settings")
            .set("Authorization", `Bearer ${token}`)
            .send({ rag: { topK: 999 } });
        expect(res.status).toBe(400);
        expect(res.body.message).toContain("rag.topK");
    });
    it("rejects invalid timeout and confidence ranges", async () => {
        const admin = await (0, auth_helper_1.createAdminUser)();
        const token = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
        const res = await (0, supertest_1.default)(app_1.default)
            .put("/api/admin/ai-settings")
            .set("Authorization", `Bearer ${token}`)
            .send({ cnn: { timeoutMs: 99, confidenceThreshold: 1.5 } });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/cnn\.(timeoutMs|confidenceThreshold)/);
    });
    it("rejects unknown or protected fields", async () => {
        const admin = await (0, auth_helper_1.createAdminUser)();
        const token = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
        const res = await (0, supertest_1.default)(app_1.default)
            .put("/api/admin/ai-settings")
            .set("Authorization", `Bearer ${token}`)
            .send({ key: "hacked", hasApiKey: true, createdAt: "x", updatedBy: "attacker", updatedAt: "fake" });
        expect(res.status).toBe(400);
    });
    it("rejects invalid fallback providers", async () => {
        const admin = await (0, auth_helper_1.createAdminUser)();
        const token = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
        const res = await (0, supertest_1.default)(app_1.default)
            .put("/api/admin/ai-settings")
            .set("Authorization", `Bearer ${token}`)
            .send({ fallback: { chatOrder: ["rag", "something-else"] } });
        expect(res.status).toBe(400);
    });
    it("deduplicates fallback order values", async () => {
        const admin = await (0, auth_helper_1.createAdminUser)();
        const token = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
        const res = await (0, supertest_1.default)(app_1.default)
            .put("/api/admin/ai-settings")
            .set("Authorization", `Bearer ${token}`)
            .send({
            cnn: { enabled: false },
            rag: { enabled: false },
            fallback: { chatOrder: ["rag", "rag", "llm"] },
        });
        expect(res.status).toBe(200);
        expect(res.body.data.fallback.chatOrder).toEqual(["rag", "llm"]);
    });
    it("logs endpoint requires admin", async () => {
        const user = await (0, auth_helper_1.createTestUser)();
        const token = await (0, auth_helper_1.getAuthToken)(user.email, user.password);
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/admin/ai-settings/logs")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(403);
    });
    it("logs endpoint supports limit and filters", async () => {
        const admin = await (0, auth_helper_1.createAdminUser)();
        const token = await (0, auth_helper_1.getAuthToken)(admin.email, admin.password);
        await ai_call_log_model_1.default.create({ feature: "chat", provider: "rag", status: "success", latencyMs: 33, userId: String(admin.user?._id) });
        await ai_call_log_model_1.default.create({ feature: "diagnosis", provider: "cnn", status: "failure", latencyMs: 44, userId: String(admin.user?._id), errorMessage: "x" });
        const res = await (0, supertest_1.default)(app_1.default)
            .get("/api/admin/ai-settings/logs?feature=chat&status=success&limit=1")
            .set("Authorization", `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBe(1);
        expect(res.body.data[0].feature).toBe("chat");
    });
});
