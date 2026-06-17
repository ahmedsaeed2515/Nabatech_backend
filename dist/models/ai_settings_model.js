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
const mongoose_1 = __importStar(require("mongoose"));
const aiSettingsSchema = new mongoose_1.Schema({
    key: { type: String, required: true, unique: true, default: "default" },
    cnn: {
        enabled: { type: Boolean, default: true },
        provider: { type: String, default: "huggingface-space", trim: true },
        endpointUrl: { type: String, default: "", trim: true },
        timeoutMs: { type: Number, default: 35000, min: 1000, max: 120000 },
        inputSize: { type: Number, default: 224, min: 32, max: 4096 },
        preprocessRequired: { type: Boolean, default: false },
        confidenceThreshold: { type: Number, default: 0, min: 0, max: 1 },
        pool: {
            type: [
                {
                    name: { type: String, default: "", trim: true },
                    enabled: { type: Boolean, default: true },
                    endpointUrl: { type: String, default: "", trim: true },
                    apiKeyEnc: { type: String, default: "" },
                    timeoutMs: { type: Number, min: 1000, max: 120000 },
                },
            ],
            default: [],
        },
    },
    rag: {
        enabled: { type: Boolean, default: true },
        endpointUrl: { type: String, default: "", trim: true },
        timeoutMs: { type: Number, default: 20000, min: 1000, max: 120000 },
        topK: { type: Number, default: 8, min: 1, max: 100 },
    },
    llm: {
        enabled: { type: Boolean, default: true },
        provider: { type: String, default: "openai", trim: true },
        model: { type: String, default: "gpt-4o-mini", trim: true },
        timeoutMs: { type: Number, default: 25000, min: 1000, max: 120000 },
        systemPrompt: { type: String, default: "You are a helpful agriculture assistant." },
        pool: {
            type: [
                {
                    name: { type: String, default: "", trim: true },
                    enabled: { type: Boolean, default: true },
                    providerType: {
                        type: String,
                        enum: ["generic_llm", "openai_compatible", "anthropic", "gemini", "cohere", "huggingface_inference", "ollama"],
                        default: "openai_compatible",
                    },
                    endpointUrl: { type: String, default: "", trim: true },
                    model: { type: String, default: "", trim: true },
                    apiKeyEnc: { type: String, default: "" },
                    timeoutMs: { type: Number, min: 1000, max: 120000 },
                },
            ],
            default: [],
        },
    },
    fallback: {
        chatOrder: { type: [String], default: ["rag", "llm"] },
        diagnosisOrder: { type: [String], default: ["cnn"] },
    },
    features: {
        allowFlutterOfflineModel: { type: Boolean, default: true },
        allowBackendFallbackToLLM: { type: Boolean, default: true },
    },
    pipeline: {
        imageFirst: { type: Boolean, default: true },
        answerAfterDiagnosis: { type: Boolean, default: true },
        allowAnswerIfCnnFails: { type: Boolean, default: false },
        lowConfidenceBehavior: {
            type: String,
            enum: ["warn", "ask_for_new_image", "block"],
            default: "warn",
        },
    },
    secrets: {
        openaiApiKeyEnc: { type: String, default: "" },
        ragApiKeyEnc: { type: String, default: "" },
        cnnApiKeyEnc: { type: String, default: "" },
    },
    updatedBy: { type: String, default: "" },
}, { timestamps: true });
exports.default = mongoose_1.default.model("AiSettings", aiSettingsSchema);
