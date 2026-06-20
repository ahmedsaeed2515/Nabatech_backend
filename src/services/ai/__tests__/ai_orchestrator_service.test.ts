import { orchestrateAssistantRequest } from "../ai_orchestrator_service";
import * as llmProvider from "../llm_provider";
import * as ragProvider from "../rag_provider";
import * as cnnProvider from "../cnn_provider";
import * as configService from "../ai_config_service";

jest.mock("../llm_provider");
jest.mock("../rag_provider");
jest.mock("../cnn_provider");
jest.mock("../ai_config_service");
jest.mock("../../../models/ai_call_log_model", () => ({
  create: jest.fn().mockResolvedValue({}),
}));
jest.mock("../community_knowledge_retriever", () => ({
  retrieveCommunityContext: jest.fn().mockResolvedValue({ hasData: false, text: "" }),
}));
jest.mock("../../../models/disease_knowledge_record_model", () => ({
  DiseaseKnowledgeRecord: {
    findOne: jest.fn().mockResolvedValue(null),
  },
}));

const mockAskLlm = llmProvider.askLlm as jest.MockedFunction<typeof llmProvider.askLlm>;
const mockRetrieveRag = ragProvider.retrieveRagChunks as jest.MockedFunction<typeof ragProvider.retrieveRagChunks>;
const mockRunCnn = cnnProvider.runCnnDiagnosis as jest.MockedFunction<typeof cnnProvider.runCnnDiagnosis>;
const mockGetSettings = configService.getAiSettings as jest.MockedFunction<typeof configService.getAiSettings>;

const mockSettings = {
  pipeline: {
    imageFirst: true,
    answerAfterDiagnosis: true,
    allowAnswerIfCnnFails: false,
    lowConfidenceBehavior: "warn" as const,
  },
  rag: { enabled: true, endpointUrl: "http://mock-rag.test", timeoutMs: 5000 },
  llm: { enabled: true, pool: [] },
  cnn: { confidenceThreshold: 0.5, pool: [] },
  features: { allowBackendFallbackToLLM: false, allowFlutterOfflineModel: true },
  fallback: { chatOrder: ["rag"], diagnosisOrder: ["cnn"] },
  secrets: {},
} as any;

const mockCnnResult = {
  prediction: "Tomato Early Blight",
  confidence: 0.92,
  candidates: [{ label: "Tomato Early Blight", confidence: 0.92 }],
  provider: "cnn" as const,
};

const mockRagResult = {
  contextText: "Tomato early blight is caused by Alternaria solani...",
  chunks: [{ text: "Treatment: apply fungicide every 7-10 days", score: 0.95 }],
  totalFound: 1,
  source: "mock",
  provider: "mock-rag",
} as any;

describe("ai_orchestrator_service — cascade flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSettings.mockResolvedValue(mockSettings);
    mockRunCnn.mockResolvedValue(mockCnnResult);
    mockRetrieveRag.mockResolvedValue(mockRagResult);
  });

  // ── Test 1 ──────────────────────────────────────────────────
  it("Search LLM output is passed to RAG, not the raw user message", async () => {
    mockAskLlm
      .mockResolvedValueOnce({
        message: "tomato early blight treatment fungicide",
        source: "llm",
        provider: "openai",
      })
      .mockResolvedValueOnce({
        message: "Apply copper-based fungicide weekly.",
        source: "llm",
        provider: "openai",
      });

    await orchestrateAssistantRequest({
      fileBuffer: Buffer.from("fake-image"),
      question: "my tomato leaves are yellow and have spots",
      history: [],
    });

    expect(mockRetrieveRag).toHaveBeenCalledWith(
      expect.anything(),
      "Tomato Early Blight",
      "tomato early blight treatment fungicide",
      undefined
    );
  });

  // ── Test 2 ──────────────────────────────────────────────────
  it("If Search LLM fails, RAG receives the raw user message", async () => {
    mockAskLlm
      .mockRejectedValueOnce(new Error("Search LLM failed"))
      .mockResolvedValueOnce({
        message: "Apply copper-based fungicide weekly.",
        source: "llm",
        provider: "openai",
      });

    await orchestrateAssistantRequest({
      fileBuffer: Buffer.from("fake-image"),
      question: "my tomato leaves are yellow and have spots",
      history: [],
    });

    expect(mockRetrieveRag).toHaveBeenCalledWith(
      expect.anything(),
      "Tomato Early Blight",
      "my tomato leaves are yellow and have spots",
      undefined
    );
  });

  // ── Test 3 ──────────────────────────────────────────────────
  it("CNN prediction is present in the Search LLM call context", async () => {
    mockAskLlm
      .mockResolvedValueOnce({ message: "optimized query", source: "llm", provider: "openai" })
      .mockResolvedValueOnce({ message: "final answer", source: "llm", provider: "openai" });

    await orchestrateAssistantRequest({
      fileBuffer: Buffer.from("fake-image"),
      question: "what is wrong with my plant",
      history: [],
    });

    const searchLlmCall = mockAskLlm.mock.calls[0];
    const searchPrompt = searchLlmCall[1];
    expect(searchPrompt).toContain("Tomato Early Blight");
  });

  // ── Test 4 ──────────────────────────────────────────────────
  it("Final response comes from Chat LLM, not Search LLM", async () => {
    mockAskLlm
      .mockResolvedValueOnce({ message: "SEARCH_OUTPUT", source: "llm", provider: "openai" })
      .mockResolvedValueOnce({ message: "FINAL_ANSWER", source: "llm", provider: "openai" });

    const result = await orchestrateAssistantRequest({
      fileBuffer: Buffer.from("fake-image"),
      question: "what is wrong with my plant",
      history: [],
    });

    expect(result.message).toBe("FINAL_ANSWER");
    expect(result.message).not.toBe("SEARCH_OUTPUT");
  });

  // ── Test 5 ──────────────────────────────────────────────────
  it("Chat LLM prompt contains RAG chunks context", async () => {
    mockAskLlm
      .mockResolvedValueOnce({ message: "optimized query", source: "llm", provider: "openai" })
      .mockResolvedValueOnce({ message: "final answer", source: "llm", provider: "openai" });

    await orchestrateAssistantRequest({
      fileBuffer: Buffer.from("fake-image"),
      question: "what is wrong with my plant",
      history: [],
    });

    const chatLlmCall = mockAskLlm.mock.calls[1];
    const chatPrompt = chatLlmCall[1];
    expect(chatPrompt).toContain("Tomato early blight is caused by Alternaria solani");
  });

  // ── Test 6 ──────────────────────────────────────────────────
  it("If RAG fails, Chat LLM still runs (with empty context)", async () => {
    mockRetrieveRag.mockRejectedValue(new Error("RAG unavailable"));
    mockAskLlm
      .mockResolvedValueOnce({ message: "optimized query", source: "llm", provider: "openai" })
      .mockResolvedValueOnce({ message: "answer without rag", source: "llm", provider: "openai" });

    const result = await orchestrateAssistantRequest({
      fileBuffer: Buffer.from("fake-image"),
      question: "what is wrong with my plant",
      history: [],
    });

    expect(result.message).toBe("answer without rag");
    expect(mockAskLlm).toHaveBeenCalledTimes(2);
  });
});
