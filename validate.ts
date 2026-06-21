import { orchestrateAssistantRequest, orchestrateChat } from './src/services/ai/ai_orchestrator_service';
import * as ragProvider from './src/services/ai/rag_provider';
import * as llmProvider from './src/services/ai/llm_provider';
import * as cnnProvider from './src/services/ai/cnn_provider';

// Mock DB dependencies
import * as logger from './src/services/ai/ai_logger_service';
(logger as any).logAiCall = async () => {};

import * as expert from './src/services/expert_escalation_service';
(expert as any).ExpertEscalationService = { requestExpertReview: async () => {} };

import * as dk from './src/models/disease_knowledge_record_model';
(dk as any).DiseaseKnowledgeRecord = { findOne: async () => null };

import * as aiConfig from './src/services/ai/ai_config_service';
(aiConfig as any).getAiSettings = async () => ({
  pipeline: { imageFirst: true, lowConfidenceBehavior: "warn", answerAfterDiagnosis: true },
  cnn: { confidenceThreshold: 0.5 },
  rag: { enabled: true, endpointUrl: "http://dummy", timeoutMs: 5000, topK: 8 },
  llm: { enabled: true, timeoutMs: 5000, systemPrompt: "System" },
  secrets: { ragApiKey: "dummy" }
});

async function runValidation() {
  console.log("=== STARTING VALIDATION ===");

  let ragCalled = false;
  let passedLanguage = '';
  let passedCrop = '';
  (ragProvider as any).retrieveRagChunks = async (...args: any[]) => {
    ragCalled = true;
    passedLanguage = args[4];
    passedCrop = args[5];
    return {
      contextText: "Some context",
      chunks: [{text: "Some context", source: "DB", score: 0.9}],
      totalFound: 1,
      source: "rag",
      provider: "rag"
    };
  };

  // Mock CNN for Test 1
  (cnnProvider as any).runCnnDiagnosis = async () => {
    return {
      prediction: "Tomato___Tomato_mosaic_virus",
      confidence: 0.1567,
      candidates: [],
      provider: "huggingface-space"
    };
  };

  console.log("\n--- TEST 1: LOW CONFIDENCE ---");
  try {
    const result1 = await orchestrateAssistantRequest({
      userId: "test_user",
      requestId: "test1",
      question: "",
      history: [],
      fileBuffer: Buffer.from("dummy"),
      originalName: "test.jpg"
    });
    console.log("Result1:", JSON.stringify(result1, null, 2));
    console.log("RAG Called?", ragCalled);
  } catch (e) {
    console.error(e);
  }

  // Reset flag
  ragCalled = false;

  // Mock CNN for Test 2
  (cnnProvider as any).runCnnDiagnosis = async () => {
    return {
      prediction: "Tomato___Bacterial_spot",
      confidence: 0.95,
      candidates: [],
      provider: "huggingface-space"
    };
  };

  // Mock LLM
  (llmProvider as any).askLlm = async (...args: any[]) => {
    return {
      message: "Here is the Arabic treatment for Bacterial Spot",
      source: "llm",
      provider: "openai"
    };
  };

  console.log("\n--- TEST 2 & 3: HIGH CONFIDENCE / ARABIC ---");
  try {
    const result2 = await orchestrateAssistantRequest({
      userId: "test_user",
      requestId: "test2",
      question: "ما هو مرض هذا النبات؟",
      language: "ar",
      history: [],
      fileBuffer: Buffer.from("dummy"),
      originalName: "test2.jpg"
    });
    console.log("Result2:", JSON.stringify(result2, null, 2));
    console.log("RAG Called?", ragCalled);
    console.log("Passed Language:", passedLanguage);
    console.log("Passed Crop:", passedCrop);
  } catch (e) {
    console.error(e);
  }

  console.log("=== END OF VALIDATION ===");
}

runValidation();
