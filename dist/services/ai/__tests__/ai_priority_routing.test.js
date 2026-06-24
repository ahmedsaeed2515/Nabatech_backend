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
const configService = __importStar(require("../ai_config_service"));
const hfProvider = __importStar(require("../hf_integrated_provider"));
// Mock dependencies
jest.mock("../llm_provider");
jest.mock("../rag_provider", () => ({
    retrieveRagChunks: jest.fn().mockResolvedValue({ chunks: [], totalFound: 0 }),
}));
jest.mock("../cnn_provider");
jest.mock("../ai_config_service");
jest.mock("../hf_integrated_provider");
jest.mock("../community_knowledge_retriever", () => ({
    retrieveCommunityContext: jest.fn().mockResolvedValue({ hasData: false }),
}));
jest.mock("../memory_manager", () => ({
    MemoryManager: {
        getAllContext: jest.fn().mockResolvedValue("mock memory context"),
        saveShortTermMemory: jest.fn().mockResolvedValue(true),
        saveLongTermMemory: jest.fn().mockResolvedValue(true),
    },
}));
jest.mock("../agent_llm_provider", () => ({
    AgentLlmProvider: jest.fn().mockImplementation(() => ({
        runAgentLoop: jest.fn().mockResolvedValue({ message: "Agent response", toolCalls: [] }),
    })),
}));
jest.mock("../../../models/ai_call_log_model", () => ({
    create: jest.fn().mockResolvedValue({}),
}));
const mockAskLlm = llmProvider.askLlm;
const mockGetSettings = configService.getAiSettings;
const mockAskHf = hfProvider.askHuggingFaceIntegrated;
const baseSettings = {
    rag: { enabled: true, endpointUrl: "http://mock-rag" },
    llm: { enabled: true },
    aiModePriority: ["rag_openai"],
    hfIntegrated: {
        grokEndpointUrl: "http://mock-grok",
        v8EndpointUrl: "http://mock-v8",
        v62EndpointUrl: "http://mock-v62",
        timeoutMs: 40000,
    },
};
describe("AI Priority Routing Logic", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it("should successfully return response from the first HF mode if it succeeds", async () => {
        mockGetSettings.mockResolvedValue({
            ...baseSettings,
            aiModePriority: ["hf_grok", "rag_openai"],
        });
        mockAskHf.mockResolvedValueOnce({
            success: true,
            mode: "hf_grok",
            answer: "Grok says hello",
            provider: "http://mock-grok",
            latencyMs: 150,
        });
        const result = await (0, ai_orchestrator_service_1.orchestrateChat)({
            question: "Hello?",
            history: [],
        });
        expect(mockAskHf).toHaveBeenCalledTimes(1);
        expect(mockAskHf).toHaveBeenCalledWith("hf_grok", "http://mock-grok", "Hello?", [], 40000);
        expect(mockAskLlm).not.toHaveBeenCalled(); // RAG+OpenAI should be skipped
        expect(result.message).toBe("Grok says hello");
        expect(result.source).toBe("hf_grok");
    });
    it("should fallback to the second HF mode if the first one fails", async () => {
        mockGetSettings.mockResolvedValue({
            ...baseSettings,
            aiModePriority: ["hf_grok", "hf_v8", "rag_openai"],
        });
        // First fails
        mockAskHf.mockResolvedValueOnce({
            success: false,
            mode: "hf_grok",
            error: "Timeout",
            latencyMs: 40000,
        });
        // Second succeeds
        mockAskHf.mockResolvedValueOnce({
            success: true,
            mode: "hf_v8",
            answer: "V8 says hello",
            provider: "http://mock-v8",
            latencyMs: 1500,
        });
        const result = await (0, ai_orchestrator_service_1.orchestrateChat)({
            question: "Hello?",
            history: [],
        });
        expect(mockAskHf).toHaveBeenCalledTimes(2);
        expect(mockAskHf).toHaveBeenNthCalledWith(1, "hf_grok", "http://mock-grok", "Hello?", [], 40000);
        expect(mockAskHf).toHaveBeenNthCalledWith(2, "hf_v8", "http://mock-v8", "Hello?", [], 40000);
        expect(mockAskLlm).not.toHaveBeenCalled(); // RAG+OpenAI skipped
        expect(result.message).toBe("V8 says hello");
        expect(result.source).toBe("hf_v8");
    });
    it("should fallback to rag_openai if all HF modes fail", async () => {
        mockGetSettings.mockResolvedValue({
            ...baseSettings,
            aiModePriority: ["hf_grok", "hf_v8", "rag_openai"],
        });
        // Both HF modes fail
        mockAskHf.mockResolvedValue({
            success: false,
            mode: "hf_grok", // Actually mode doesn't matter for the mock return here, it just simulates failure
            error: "Failed",
            latencyMs: 1000,
        });
        // RAG+OpenAI mock (the main LLM pipeline)
        mockAskLlm.mockResolvedValue({
            message: "OpenAI says hello",
            source: "llm",
            provider: "openai",
        });
        const result = await (0, ai_orchestrator_service_1.orchestrateChat)({
            question: "Hello?",
            history: [],
        });
        expect(mockAskHf).toHaveBeenCalledTimes(2); // Tried both grok and v8
        expect(mockAskLlm).toHaveBeenCalled(); // Eventually hit the rag_openai pipeline
        expect(result.message).toBe("OpenAI says hello");
        expect(result.source).toBe("llm");
    });
    it("should return the fallback failure message if NO modes succeed and rag_openai is not in the list", async () => {
        mockGetSettings.mockResolvedValue({
            ...baseSettings,
            aiModePriority: ["hf_grok", "hf_v8"], // No rag_openai here!
        });
        mockAskHf.mockResolvedValue({
            success: false,
            mode: "hf_grok",
            error: "Server Error",
            latencyMs: 500,
        });
        const result = await (0, ai_orchestrator_service_1.orchestrateChat)({
            question: "Hello?",
            history: [],
        });
        expect(mockAskHf).toHaveBeenCalledTimes(2);
        expect(mockAskLlm).not.toHaveBeenCalled(); // Cannot fall back to rag_openai because it's not in priority list!
        expect(result.message).toMatch(/All selected AI modes failed to respond/);
        expect(result.source).toBe("fallback");
    });
});
