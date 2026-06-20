"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const ai_orchestrator_service_1 = require("../ai_orchestrator_service");
const llmProvider = __importStar(require("../llm_provider"));
const ragProvider = __importStar(require("../rag_provider"));
const cnnProvider = __importStar(require("../cnn_provider"));
const configService = __importStar(require("../ai_config_service"));
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
const mockAskLlm = llmProvider.askLlm;
const mockRetrieveRag = ragProvider.retrieveRagChunks;
const mockRunCnn = cnnProvider.runCnnDiagnosis;
const mockGetSettings = configService.getAiSettings;
const mockSettings = {
    pipeline: {
        imageFirst: true,
        answerAfterDiagnosis: true,
        allowAnswerIfCnnFails: false,
        lowConfidenceBehavior: "warn",
    },
    rag: { enabled: true, endpointUrl: "http://mock-rag.test", timeoutMs: 5000 },
    llm: { enabled: true, pool: [] },
    cnn: { confidenceThreshold: 0.5, pool: [] },
    features: { allowBackendFallbackToLLM: false, allowFlutterOfflineModel: true },
    fallback: { chatOrder: ["rag"], diagnosisOrder: ["cnn"] },
    secrets: {},
};
const mockCnnResult = {
    prediction: "Tomato Early Blight",
    confidence: 0.92,
    candidates: [{ label: "Tomato Early Blight", confidence: 0.92 }],
    provider: "cnn",
};
const mockRagResult = {
    contextText: "Tomato early blight is caused by Alternaria solani...",
    chunks: [{ text: "Treatment: apply fungicide every 7-10 days", score: 0.95 }],
    totalFound: 1,
    source: "mock",
    provider: "mock-rag",
};
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
        await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            fileBuffer: Buffer.from("fake-image"),
            question: "my tomato leaves are yellow and have spots",
            history: [],
        });
        expect(mockRetrieveRag).toHaveBeenCalledWith(expect.anything(), "Tomato Early Blight", "tomato early blight treatment fungicide", undefined);
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
        await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            fileBuffer: Buffer.from("fake-image"),
            question: "my tomato leaves are yellow and have spots",
            history: [],
        });
        expect(mockRetrieveRag).toHaveBeenCalledWith(expect.anything(), "Tomato Early Blight", "my tomato leaves are yellow and have spots", undefined);
    });
    // ── Test 3 ──────────────────────────────────────────────────
    it("CNN prediction is present in the Search LLM call context", async () => {
        mockAskLlm
            .mockResolvedValueOnce({ message: "optimized query", source: "llm", provider: "openai" })
            .mockResolvedValueOnce({ message: "final answer", source: "llm", provider: "openai" });
        await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
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
        const result = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
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
        await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
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
        const result = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            fileBuffer: Buffer.from("fake-image"),
            question: "what is wrong with my plant",
            history: [],
        });
        expect(result.message).toBe("answer without rag");
        expect(mockAskLlm).toHaveBeenCalledTimes(2);
    });
});
