"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
jest.mock("../services/ai/rag_provider", () => ({ askRag: jest.fn() }));
jest.mock("../services/ai/llm_provider", () => ({ askLlm: jest.fn() }));
jest.mock("../services/ai/cnn_provider", () => ({ runCnnDiagnosis: jest.fn() }));
jest.mock("../services/ai/ai_config_service", () => ({
    getAiSettings: jest.fn(),
}));
jest.mock("../models/ai_call_log_model", () => ({
    __esModule: true,
    default: { create: jest.fn() },
}));
const rag_provider_1 = require("../services/ai/rag_provider");
const llm_provider_1 = require("../services/ai/llm_provider");
const cnn_provider_1 = require("../services/ai/cnn_provider");
const ai_config_service_1 = require("../services/ai/ai_config_service");
const ai_orchestrator_service_1 = require("../services/ai/ai_orchestrator_service");
const mockedAskRag = rag_provider_1.askRag;
const mockedAskLlm = llm_provider_1.askLlm;
const mockedRunCnnDiagnosis = cnn_provider_1.runCnnDiagnosis;
const mockedGetAiSettings = ai_config_service_1.getAiSettings;
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
        });
    });
    it("uses RAG first then LLM if RAG fails", async () => {
        mockedAskRag.mockRejectedValueOnce(new Error("rag down"));
        mockedAskLlm.mockResolvedValueOnce({ message: "llm answer", source: "fallback", provider: "openai" });
        const result = await (0, ai_orchestrator_service_1.orchestrateChat)({
            userId: "u1",
            question: "hello",
            history: [],
            topK: 8,
        });
        expect(mockedAskRag).toHaveBeenCalledTimes(1);
        expect(mockedAskLlm).toHaveBeenCalledTimes(1);
        expect(result.message).toBe("llm answer");
    });
    it("assistant image+question calls CNN before chat provider", async () => {
        mockedRunCnnDiagnosis.mockResolvedValueOnce({
            prediction: "leaf spot",
            confidence: 0.8,
            candidates: [{ label: "leaf spot", confidence: 0.8 }],
            provider: "cnn",
        });
        mockedAskRag.mockResolvedValueOnce({ message: "care", source: "rag", provider: "rag" });
        const result = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            userId: "u1",
            fileBuffer: Buffer.from("img"),
            originalName: "leaf.jpg",
            question: "what is this?",
            history: [],
        });
        expect(mockedRunCnnDiagnosis).toHaveBeenCalledTimes(1);
        expect(mockedAskRag).toHaveBeenCalledTimes(1);
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
        });
        mockedRunCnnDiagnosis.mockResolvedValueOnce({
            prediction: "unknown",
            confidence: 0.2,
            candidates: [{ label: "unknown", confidence: 0.2 }],
            provider: "cnn",
        });
        mockedAskRag.mockResolvedValueOnce({ message: "please upload clearer image", source: "rag", provider: "rag" });
        const result = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            userId: "u1",
            fileBuffer: Buffer.from("img"),
            originalName: "leaf.jpg",
            question: "help",
            history: [],
        });
        expect(result.lowConfidenceWarning).toContain("Low CNN confidence");
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
        });
        mockedRunCnnDiagnosis.mockRejectedValueOnce(new Error("cnn failed"));
        mockedAskRag.mockResolvedValueOnce({ message: "fallback answer", source: "rag", provider: "rag" });
        const result = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
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
        await expect((0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            userId: "u1",
            fileBuffer: Buffer.from("img"),
            originalName: "leaf.jpg",
            question: "help",
            history: [],
        })).rejects.toThrow("cnn failed");
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
        });
        mockedRunCnnDiagnosis.mockResolvedValueOnce({
            prediction: "early blight",
            confidence: 0.3,
            candidates: [{ label: "early blight", confidence: 0.3 }],
            provider: "cnn",
        });
        const result = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            userId: "u1",
            fileBuffer: Buffer.from("img"),
            originalName: "leaf.jpg",
            question: "what should I do?",
            history: [],
        });
        expect(mockedAskRag).not.toHaveBeenCalled();
        expect(mockedAskLlm).not.toHaveBeenCalled();
        expect(result.mode).toBe("image_chat");
        expect(result.message).toContain("too low");
        expect(result.needsNewImage).toBe(true);
        expect(result.recommendedAction).toBe("upload_clearer_image");
        expect(result.lowConfidenceWarning).toContain("Low CNN confidence");
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
        });
        mockedRunCnnDiagnosis.mockResolvedValueOnce({
            prediction: "early blight",
            confidence: 0.3,
            candidates: [{ label: "early blight", confidence: 0.3 }],
            provider: "cnn",
        });
        mockedAskRag.mockResolvedValueOnce({ message: "LLM result.", source: "rag", provider: "rag" });
        const result = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            userId: "u1",
            fileBuffer: Buffer.from("img"),
            originalName: "leaf.jpg",
            question: "what should I do?",
            history: [],
        });
        expect(mockedAskRag).toHaveBeenCalled();
        expect(result.needsNewImage).toBe(true);
        expect(result.recommendedAction).toBe("upload_clearer_image");
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
        });
        mockedRunCnnDiagnosis.mockResolvedValueOnce({
            prediction: "early blight",
            confidence: 0.3,
            candidates: [{ label: "early blight", confidence: 0.3 }],
            provider: "cnn",
        });
        mockedAskRag.mockResolvedValueOnce({ message: "LLM result.", source: "rag", provider: "rag" });
        const result = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            userId: "u1",
            fileBuffer: Buffer.from("img"),
            originalName: "leaf.jpg",
            question: "what should I do?",
            history: [],
        });
        expect(mockedAskRag).toHaveBeenCalled();
        expect(result.needsNewImage).toBe(false);
        expect(result.recommendedAction).toBe("review_with_caution");
        expect(result.message).toBe("LLM result.");
        expect(result.lowConfidenceWarning).toContain("Low CNN confidence");
    });
});
