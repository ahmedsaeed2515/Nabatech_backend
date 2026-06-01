import request from "supertest";
import app from "../app";
import AiCallLog from "../models/ai_call_log_model";
import { clearTestDB, connectTestDB, disconnectTestDB } from "./db.setup";
import { createAdminUser, createTestUser, getAuthToken } from "./helpers/auth.helper";

beforeAll(async () => {
  await connectTestDB();
});

afterAll(async () => {
  await disconnectTestDB();
});

beforeEach(async () => {
  await clearTestDB();
});

describe("AI Settings admin endpoints", () => {
  it("non-admin cannot access settings", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user.email, user.password);

    const res = await request(app)
      .get("/api/admin/ai-settings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("admin reads redacted settings only", async () => {
    const admin = await createAdminUser();
    const token = await getAuthToken(admin.email, admin.password);

    const res = await request(app)
      .get("/api/admin/ai-settings")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.llm.hasApiKey).toBeDefined();
    expect(res.body.data.llm.apiKey).toBeUndefined();
  });

  it("admin updates valid settings", async () => {
    const admin = await createAdminUser();
    const token = await getAuthToken(admin.email, admin.password);

    const res = await request(app)
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
    const admin = await createAdminUser();
    const token = await getAuthToken(admin.email, admin.password);

    const res = await request(app)
      .put("/api/admin/ai-settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ rag: { enabled: true, endpointUrl: "javascript:alert(1)" } });

    expect(res.status).toBe(400);
  });

  it("rejects invalid numeric ranges", async () => {
    const admin = await createAdminUser();
    const token = await getAuthToken(admin.email, admin.password);

    const res = await request(app)
      .put("/api/admin/ai-settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ rag: { topK: 999 } });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain("rag.topK");
  });

  it("rejects invalid timeout and confidence ranges", async () => {
    const admin = await createAdminUser();
    const token = await getAuthToken(admin.email, admin.password);

    const res = await request(app)
      .put("/api/admin/ai-settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ cnn: { timeoutMs: 99, confidenceThreshold: 1.5 } });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cnn\.(timeoutMs|confidenceThreshold)/);
  });

  it("rejects unknown or protected fields", async () => {
    const admin = await createAdminUser();
    const token = await getAuthToken(admin.email, admin.password);

    const res = await request(app)
      .put("/api/admin/ai-settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ key: "hacked", hasApiKey: true, createdAt: "x", updatedBy: "attacker", updatedAt: "fake" });

    expect(res.status).toBe(400);
  });

  it("rejects invalid fallback providers", async () => {
    const admin = await createAdminUser();
    const token = await getAuthToken(admin.email, admin.password);

    const res = await request(app)
      .put("/api/admin/ai-settings")
      .set("Authorization", `Bearer ${token}`)
      .send({ fallback: { chatOrder: ["rag", "something-else"] } });

    expect(res.status).toBe(400);
  });

  it("deduplicates fallback order values", async () => {
    const admin = await createAdminUser();
    const token = await getAuthToken(admin.email, admin.password);

    const res = await request(app)
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
    const user = await createTestUser();
    const token = await getAuthToken(user.email, user.password);

    const res = await request(app)
      .get("/api/admin/ai-settings/logs")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("logs endpoint supports limit and filters", async () => {
    const admin = await createAdminUser();
    const token = await getAuthToken(admin.email, admin.password);

    await AiCallLog.create({ feature: "chat", provider: "rag", status: "success", latencyMs: 33, userId: String(admin.user?._id) });
    await AiCallLog.create({ feature: "diagnosis", provider: "cnn", status: "failure", latencyMs: 44, userId: String(admin.user?._id), errorMessage: "x" });

    const res = await request(app)
      .get("/api/admin/ai-settings/logs?feature=chat&status=success&limit=1")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].feature).toBe("chat");
  });
});
