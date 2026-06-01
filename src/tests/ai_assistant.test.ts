import request from "supertest";
import app from "../app";
import { clearTestDB, connectTestDB, disconnectTestDB } from "./db.setup";
import { createTestUser, getAuthToken } from "./helpers/auth.helper";

jest.mock("../services/ai/ai_orchestrator_service", () => ({
  orchestrateAssistantRequest: jest.fn(),
}));
jest.mock("../config/cloudinary", () => ({
  __esModule: true,
  default: {
    uploader: {
      upload_stream: (_options: any, callback: any) => ({
        end: () => callback(null, { secure_url: "https://cloudinary.test/assistant.jpg" }),
      }),
    },
  },
}));
jest.mock("../models/diagnosis_history_model", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

import { orchestrateAssistantRequest } from "../services/ai/ai_orchestrator_service";

const mockedOrchestrateAssistantRequest = orchestrateAssistantRequest as jest.MockedFunction<typeof orchestrateAssistantRequest>;
jest.setTimeout(120000);

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

describe("Unified AI assistant route", () => {
  it("text-only request uses chat mode", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user.email, user.password);
    mockedOrchestrateAssistantRequest.mockResolvedValue({
      mode: "chat",
      message: "answer",
      source: "rag",
      provider: "rag",
      providerChain: ["rag"],
      lowConfidenceWarning: "",
    } as any);

    const res = await request(app)
      .post("/api/ai/assistant")
      .set("Authorization", `Bearer ${token}`)
      .field("text", "hello");

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("chat");
    expect(mockedOrchestrateAssistantRequest).toHaveBeenCalled();
  });

  it("image + question request returns image_chat mode", async () => {
    const user = await createTestUser();
    const token = await getAuthToken(user.email, user.password);
    mockedOrchestrateAssistantRequest.mockResolvedValue({
      mode: "image_chat",
      diagnosis: { prediction: "powdery mildew", confidence: 0.8, candidates: [], provider: "cnn" },
      message: "care tips",
      source: "fallback",
      provider: "openai",
      providerChain: ["cnn", "openai"],
      lowConfidenceWarning: "",
    } as any);

    const res = await request(app)
      .post("/api/ai/assistant")
      .set("Authorization", `Bearer ${token}`)
      .field("text", "what should I do?")
      .attach("file", Buffer.from("img"), "leaf.jpg");

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("image_chat");
    expect(mockedOrchestrateAssistantRequest).toHaveBeenCalled();
  });
});
