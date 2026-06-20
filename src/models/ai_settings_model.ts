import mongoose, { Document, Schema } from "mongoose";

export interface IAiSettings extends Document {
  key: string;
  cnn: {
    enabled: boolean;
    provider: string;
    endpointUrl: string;
    timeoutMs: number;
    inputSize: number;
    preprocessRequired: boolean;
    confidenceThreshold: number;
    pool?: Array<{
      name: string;
      enabled: boolean;
      endpointUrl: string;
      apiKeyEnc: string;
      timeoutMs?: number;
    }>;
  };
  rag: {
    enabled: boolean;
    endpointUrl: string;
    timeoutMs: number;
    topK: number;
  };
  llm: {
    enabled: boolean;
    provider: string;
    model: string;
    timeoutMs: number;
    systemPrompt: string;
    pool?: Array<{
      name: string;
      enabled: boolean;
      providerType: "generic_llm" | "openai_compatible" | "anthropic" | "gemini" | "cohere" | "huggingface_inference" | "ollama";
      endpointUrl: string;
      model: string;
      taskRole: "search" | "chat" | "both";
      apiKeyEnc: string;
      timeoutMs?: number;
    }>;
  };
  fallback: {
    chatOrder: string[];
    diagnosisOrder: string[];
  };
  features: {
    allowFlutterOfflineModel: boolean;
    allowBackendFallbackToLLM: boolean;
  };
  pipeline: {
    imageFirst: boolean;
    answerAfterDiagnosis: boolean;
    allowAnswerIfCnnFails: boolean;
    lowConfidenceBehavior: "warn" | "ask_for_new_image" | "block";
  };
  secrets: {
    openaiApiKeyEnc: string;
    ragApiKeyEnc: string;
    cnnApiKeyEnc: string;
  };
  updatedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const aiSettingsSchema = new Schema<IAiSettings>(
  {
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
            taskRole: {
              type: String,
              enum: ["search", "chat", "both"],
              default: "both",
            },
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
  },
  { timestamps: true }
);

export default mongoose.model<IAiSettings>("AiSettings", aiSettingsSchema);
