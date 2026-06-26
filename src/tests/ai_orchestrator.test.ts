jest.mock("../services/ai/llm_provider", () => ({ askLlm: jest.fn() }));
jest.mock("../services/ai/cnn_provider", () => ({ runCnnDiagnosis: jest.fn() }));
jest.mock("../services/ai/ai_config_service", () => ({
  getAiSettings: jest.fn(),
}));
jest.mock("../models/ai_call_log_model", () => ({
  __esModule: true,
  default: { create: jest.fn() },
}));

import { askLlm } from "../services/ai/llm_provider";
import { runCnnDiagnosis } from "../services/ai/cnn_provider";
import { getAiSettings } from "../services/ai/ai_config_service";
import { orchestrateAssistantRequest, orchestrateChat } from "../services/ai/ai_orchestrator_service";

const mockedAskLlm = askLlm as jest.MockedFunction<typeof askLlm>;
const mockedRunCnnDiagnosis = runCnnDiagnosis as jest.MockedFunction<typeof runCnnDiagnosis>;
const mockedGetAiSettings = getAiSettings as jest.MockedFunction<typeof getAiSettings>;

describe("AI orchestrator fallback", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetAiSettings.mockResolvedValue({
      key: "default",
      cnn: { enabled: true, provider: "cnn", endpointUrl: "https://example.com", timeoutMs: 35000, inputSize: 224, preprocessRequired: false, confidenceThreshold: 0 },
      rag: { enabled: true, endpointUrl: "https://example.com/rag", timeoutMs: 20000, topK: 8 },
      llm: { enabled: true, provider: "openai", model: "gpt-4o-mini", timeoutMs: 25000, systemPrompt: "test" },
      fallback: { chatOrder: ["rag", "llm"], diagnosisOrder: ["cnn"] },
      features: { allowFlutterOfflineModel: true, allowBackendFallbackToLLM: true },
      pipeline: { imageFirst: true, answerAfterDiagnosis: true, allowAnswerIfCnnFails: false, lowConfidenceBehavior: "warn" },
      secrets: { openaiApiKey: "x", ragApiKey: "", cnnApiKey: "" },
    } as any);
  });

  it("uses RAG first then LLM if RAG fails", async () => {
    mockedAskLlm.mockResolvedValue({ message: "llm answer", source: "fallback", provider: "openai" });

    const result = await orchestrateChat({
      userId: "u1",
      question: "hello",
      history: [],
      topK: 8,
    });

    expect(mockedAskLlm).toHaveBeenCalledTimes(1);
    expect(result.message).toBe("llm answer");
  });

  it("assistant image+question calls CNN before chat provider", async () => {
    mockedRunCnnDiagnosis.mockResolvedValueOnce({
      prediction: "leaf spot",
      confidence: 0.8,
      candidates: [{ label: "leaf spot", confidence: 0.8 }],
      provider: "cnn",
    } as any);

    const result = await orchestrateAssistantRequest({
      userId: "u1",
      fileBuffer: Buffer.from("img"),
      originalName: "leaf.jpg",
      question: "what is this?",
      history: [],
    });

    expect(mockedRunCnnDiagnosis).toHaveBeenCalledTimes(1);
    expect(result.mode).toBe("image_chat");
  });

  it("assistant includes low confidence warning context", async () => {
    mockedGetAiSettings.mockResolvedValueOnce({
      key: "default",
      cnn: { enabled: true, provider: "cnn", endpointUrl: "https://example.com", timeoutMs: 35000, inputSize: 224, preprocessRequired: false, confidenceThreshold: 0.7 },
      rag: { enabled: true, endpointUrl: "https://example.com/rag", timeoutMs: 20000, topK: 8 },
      llm: { enabled: true, provider: "openai", model: "gpt-4o-mini", timeoutMs: 25000, systemPrompt: "test" },
      fallback: { chatOrder: ["rag", "llm"], diagnosisOrder: ["cnn"] },
      features: { allowFlutterOfflineModel: true, allowBackendFallbackToLLM: true },
      pipeline: { imageFirst: true, answerAfterDiagnosis: true, allowAnswerIfCnnFails: false, lowConfidenceBehavior: "warn" },
      secrets: { openaiApiKey: "x", ragApiKey: "", cnnApiKey: "" },
    } as any);
    mockedRunCnnDiagnosis.mockResolvedValueOnce({
      prediction: "unknown",
      confidence: 0.2,
      candidates: [{ label: "unknown", confidence: 0.2 }],
      provider: "cnn",
    } as any);

    const result = await orchestrateAssistantRequest({
      userId: "u1",
      fileBuffer: Buffer.from("img"),
      originalName: "leaf.jpg",
      question: "help",
      history: [],
    });

    expect((result as any).lowConfidenceWarning).toContain("Low CNN confidence");
  });

  it("assistant can continue when CNN fails and allowAnswerIfCnnFails enabled", async () => {
    mockedGetAiSettings.mockResolvedValueOnce({
      key: "default",
      cnn: { enabled: true, provider: "cnn", endpointUrl: "https://example.com", timeoutMs: 35000, inputSize: 224, preprocessRequired: false, confidenceThreshold: 0.7 },
      rag: { enabled: true, endpointUrl: "https://example.com/rag", timeoutMs: 20000, topK: 8 },
      llm: { enabled: true, provider: "openai", model: "gpt-4o-mini", timeoutMs: 25000, systemPrompt: "test" },
      fallback: { chatOrder: ["rag", "llm"], diagnosisOrder: ["cnn"] },
      features: { allowFlutterOfflineModel: true, allowBackendFallbackToLLM: true },
      pipeline: { imageFirst: true, answerAfterDiagnosis: true, allowAnswerIfCnnFails: true, lowConfidenceBehavior: "warn" },
      secrets: { openaiApiKey: "x", ragApiKey: "", cnnApiKey: "" },
    } as any);
    mockedRunCnnDiagnosis.mockRejectedValueOnce(new Error("cnn failed"));

    const result = await orchestrateAssistantRequest({
      userId: "u1",
      fileBuffer: Buffer.from("img"),
      originalName: "leaf.jpg",
      question: "help",
      history: [],
    });

    expect(result.message).toBe("fallback answer");
    expect(result.providerChain).toEqual(["rag"]);
  });

  it("assistant fails when CNN fails and allowAnswerIfCnnFails disabled", async () => {
    mockedRunCnnDiagnosis.mockRejectedValueOnce(new Error("cnn failed"));

    await expect(
      orchestrateAssistantRequest({
        userId: "u1",
        fileBuffer: Buffer.from("img"),
        originalName: "leaf.jpg",
        question: "help",
        history: [],
      })
    ).rejects.toThrow("cnn failed");
  });

  it("block does not call RAG/LLM on low confidence and returns safe structured response", async () => {
    mockedGetAiSettings.mockResolvedValueOnce({
      key: "default",
      cnn: { enabled: true, provider: "cnn", confidenceThreshold: 0.7 },
      rag: { enabled: true },
      llm: { enabled: true },
      fallback: { chatOrder: ["rag"] },
      features: { allowBackendFallbackToLLM: true },
      pipeline: { imageFirst: true, answerAfterDiagnosis: true, allowAnswerIfCnnFails: false, lowConfidenceBehavior: "block" },
      secrets: {},
    } as any);

    mockedRunCnnDiagnosis.mockResolvedValueOnce({
      prediction: "early blight",
      confidence: 0.3,
      candidates: [{ label: "early blight", confidence: 0.3 }],
      provider: "cnn",
    } as any);

    const result = await orchestrateAssistantRequest({
      userId: "u1",
      fileBuffer: Buffer.from("img"),
      originalName: "leaf.jpg",
      question: "what should I do?",
      history: [],
    });

    expect(mockedAskLlm).not.toHaveBeenCalled();
    expect(result.mode).toBe("image_chat");
    expect(result.message).toContain("too low");
    expect((result as any).needsNewImage).toBe(true);
    expect((result as any).recommendedAction).toBe("upload_clearer_image");
    expect((result as any).lowConfidenceWarning).toContain("Low CNN confidence");
  });

  it("ask_for_new_image calls RAG/LLM and returns needsNewImage=true and recommendedAction with appended instruction", async () => {
    mockedGetAiSettings.mockResolvedValueOnce({
      key: "default",
      cnn: { enabled: true, provider: "cnn", confidenceThreshold: 0.7 },
      rag: { enabled: true },
      llm: { enabled: true },
      fallback: { chatOrder: ["rag"] },
      features: { allowBackendFallbackToLLM: true },
      pipeline: { imageFirst: true, answerAfterDiagnosis: true, allowAnswerIfCnnFails: false, lowConfidenceBehavior: "ask_for_new_image" },
      secrets: {},
    } as any);

    mockedRunCnnDiagnosis.mockResolvedValueOnce({
      prediction: "early blight",
      confidence: 0.3,
      candidates: [{ label: "early blight", confidence: 0.3 }],
      provider: "cnn",
    } as any);


    const result = await orchestrateAssistantRequest({
      userId: "u1",
      fileBuffer: Buffer.from("img"),
      originalName: "leaf.jpg",
      question: "what should I do?",
      history: [],
    });

    expect((result as any).needsNewImage).toBe(true);
    expect((result as any).recommendedAction).toBe("upload_clearer_image");
    expect(result.message).toContain("LLM result.");
    expect(result.message).toContain("Please upload a clearer image");
  });

  it("warn still calls RAG/LLM and returns caution fields", async () => {
    mockedGetAiSettings.mockResolvedValueOnce({
      key: "default",
      cnn: { enabled: true, provider: "cnn", confidenceThreshold: 0.7 },
      rag: { enabled: true },
      llm: { enabled: true },
      fallback: { chatOrder: ["rag"] },
      features: { allowBackendFallbackToLLM: true },
      pipeline: { imageFirst: true, answerAfterDiagnosis: true, allowAnswerIfCnnFails: false, lowConfidenceBehavior: "warn" },
      secrets: {},
    } as any);

    mockedRunCnnDiagnosis.mockResolvedValueOnce({
      prediction: "early blight",
      confidence: 0.3,
      candidates: [{ label: "early blight", confidence: 0.3 }],
      provider: "cnn",
    } as any);


    const result = await orchestrateAssistantRequest({
      userId: "u1",
      fileBuffer: Buffer.from("img"),
      originalName: "leaf.jpg",
      question: "what should I do?",
      history: [],
    });

    expect((result as any).needsNewImage).toBe(false);
    expect((result as any).recommendedAction).toBe("review_with_caution");
    expect(result.message).toBe("LLM result.");
    expect((result as any).lowConfidenceWarning).toContain("Low CNN confidence");
  });
});


