import request from "supertest";
import app from "../app";
import Message from "../models/message_model";
import { clearTestDB, connectTestDB, disconnectTestDB } from "./db.setup";
import { createTestUser, getAuthToken } from "./helpers/auth.helper";

jest.mock("../services/ai/ai_orchestrator_service", () => ({
  orchestrateChat: jest.fn(),
}));

import { orchestrateChat } from "../services/ai/ai_orchestrator_service";

const mockedOrchestrateChat = orchestrateChat as jest.MockedFunction<typeof orchestrateChat>;

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

describe("Chat API with orchestrator", () => {
  it("uses orchestrator and persists user+llm messages", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user.email, user.password);

    mockedOrchestrateChat.mockResolvedValue({
      message: "answer from rag",
      source: "rag",
      provider: "rag",
      ragContext: undefined,
      communityContext: undefined,
    } as any);

    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "hello", history: [], top_k: 8 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toBe("answer from rag");
    expect(res.body.source).toBe("rag");

    const messages = await Message.find();
    expect(messages.length).toBe(2);
  });

  it("returns 502 safe payload when orchestrator fails", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user.email, user.password);

    mockedOrchestrateChat.mockRejectedValue(new Error("upstream failed"));

    const res = await request(app)
      .post("/api/chat")
      .set("Authorization", `Bearer ${token}`)
      .send({ text: "hello" });

    expect(res.status).toBe(502);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain("Chat failed");
  });
});
