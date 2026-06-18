import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../app';
import { setupTestDB, loginUser } from '../setup';
import { DiseaseKnowledgeRecord } from '../../models/disease_knowledge_record_model';
import DiagnosisHistory from '../../models/diagnosis_history_model';
import AiSettings from '../../models/ai_settings_model';
import * as llmProvider from '../../services/ai/llm_provider';
import * as cnnProvider from '../../services/ai/cnn_provider';
import * as ragProvider from '../../services/ai/rag_provider';
import path from 'path';

setupTestDB();

jest.mock('../../services/ai/llm_provider', () => ({
  askLlm: jest.fn(),
}));

jest.mock('../../services/ai/cnn_provider', () => ({
  runCnnDiagnosis: jest.fn(),
}));

jest.mock('../../services/ai/rag_provider', () => ({
  askRag: jest.fn(),
}));

describe('AI Pipeline Hardening Integration Tests', () => {
  let authHeader: string;
  let userId: string;

  beforeAll(async () => {
    const { token, user } = await loginUser();
    authHeader = `Bearer ${token}`;
    userId = user._id.toString();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    
    await AiSettings.create({
      pipeline: { imageFirst: true, answerAfterDiagnosis: true, allowAnswerIfCnnFails: false, lowConfidenceBehavior: "warn" },
      fallback: { diagnosisOrder: ["cnn"], chatOrder: ["rag", "llm"] },
      cnn: { enabled: true, endpointUrl: "http://mock-cnn.com/predict", confidenceThreshold: 0.8 },
      rag: { enabled: true, endpointUrl: "http://mock-rag.com/retrieve", apiKey: "mock", collectionId: "mock", useForImages: true },
      llm: { provider: "openai-default", systemPrompt: "test", maxTokens: 100, temperature: 0.7 },
      features: { allowBackendFallbackToLLM: true }
    });

    await DiseaseKnowledgeRecord.create({
      diseaseNameEn: 'Tomato_Early_blight',
      diseaseNameAr: 'اللفحة المبكرة في الطماطم',
      advice: 'Mocked advice for early blight',
      severity: 'medium',
    });
  });

  it('1. image only - returns diagnosis and advice', async () => {
    (cnnProvider.runCnnDiagnosis as jest.Mock).mockResolvedValue({
      prediction: 'Tomato_Early_blight',
      confidence: 0.95,
      candidates: [],
      provider: 'mock-cnn'
    });

    (ragProvider.askRag as jest.Mock).mockResolvedValue({
      message: 'Mocked RAG Context for Early Blight',
      provider: 'mock-rag'
    });

    (llmProvider.askLlm as jest.Mock).mockResolvedValue({
      message: 'Mocked LLM advice',
      provider: 'mock-llm',
      source: 'llm'
    });

    // Provide a valid dummy image buffer
    const dummyImage = Buffer.from('dummy image data');

    const res = await request(app)
      .post('/api/assistant')
      .set('Authorization', authHeader)
      .attach('file', dummyImage, 'test.jpg');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.mode).toBe('image_chat');
    expect(res.body.diagnosis.prediction).toBe('Tomato_Early_blight');
    expect(res.body.message).toBe('Mocked LLM advice');

    // Verify DB persistence
    const history = await DiagnosisHistory.findOne({ user: userId }).sort({ createdAt: -1 });
    expect(history).toBeTruthy();
    expect(history?.advice).toBe('Mocked advice for early blight');
    expect(history?.ragContext).toContain('Mocked RAG Context for Early Blight');
  });

  it('2. image + question - returns context-aware response', async () => {
    (cnnProvider.runCnnDiagnosis as jest.Mock).mockResolvedValue({
      prediction: 'Healthy',
      confidence: 0.99,
      candidates: [],
      provider: 'mock-cnn'
    });

    (ragProvider.askRag as jest.Mock).mockResolvedValue({
      message: 'RAG context about dogs and plants',
      provider: 'mock-rag'
    });

    (llmProvider.askLlm as jest.Mock).mockResolvedValue({
      message: 'No, it is not dangerous.',
      provider: 'mock-llm',
      source: 'llm'
    });

    const dummyImage = Buffer.from('dummy image data');

    const res = await request(app)
      .post('/api/assistant')
      .set('Authorization', authHeader)
      .field('text', 'Is this dangerous for my dog?')
      .attach('file', dummyImage, 'test.jpg');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('No, it is not dangerous.');
    
    // Verify RAG was called with just the text
    expect(ragProvider.askRag).toHaveBeenCalledWith(
      expect.anything(),
      'Is this dangerous for my dog?',
      [],
      undefined
    );
  });

  it('3. follow-up conversation - processes history correctly', async () => {
    (ragProvider.askRag as jest.Mock).mockResolvedValue({
      message: 'RAG Context for follow-up',
      provider: 'mock-rag'
    });

    (llmProvider.askLlm as jest.Mock).mockResolvedValue({
      message: 'Here is the watering schedule.',
      provider: 'mock-llm',
      source: 'llm'
    });

    const res = await request(app)
      .post('/api/assistant')
      .set('Authorization', authHeader)
      .send({
        text: 'How often should I water it?',
        history: [{ role: 'user', content: 'What is this plant?' }]
      });

    expect(res.status).toBe(200);
    expect(res.body.mode).toBe('chat');
    expect(res.body.message).toBe('Here is the watering schedule.');

    // LLM should receive history
    expect(llmProvider.askLlm).toHaveBeenCalledWith(
      expect.anything(),
      expect.stringContaining('How often should I water it?'),
      'llm',
      [{ role: 'user', content: 'What is this plant?' }]
    );
  });

  it('4. failure modes - CNN fails', async () => {
    (cnnProvider.runCnnDiagnosis as jest.Mock).mockRejectedValue(new Error('CNN Offline'));

    const dummyImage = Buffer.from('dummy image data');
    const res = await request(app)
      .post('/api/assistant')
      .set('Authorization', authHeader)
      .attach('file', dummyImage, 'test.jpg');

    expect(res.status).toBe(502);
  });

  it('5. failure modes - RAG fails but LLM succeeds', async () => {
    (cnnProvider.runCnnDiagnosis as jest.Mock).mockResolvedValue({
      prediction: 'Healthy',
      confidence: 0.99,
      candidates: [],
      provider: 'mock-cnn'
    });

    (ragProvider.askRag as jest.Mock).mockRejectedValue(new Error('RAG Offline'));

    (llmProvider.askLlm as jest.Mock).mockResolvedValue({
      message: 'LLM generated advice without RAG',
      provider: 'mock-llm',
      source: 'llm'
    });

    const dummyImage = Buffer.from('dummy image data');
    const res = await request(app)
      .post('/api/assistant')
      .set('Authorization', authHeader)
      .attach('file', dummyImage, 'test.jpg');

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('LLM generated advice without RAG');
  });

  it('6. failure modes - LLM fails falls back to error', async () => {
    (cnnProvider.runCnnDiagnosis as jest.Mock).mockResolvedValue({
      prediction: 'Healthy',
      confidence: 0.99,
      candidates: [],
      provider: 'mock-cnn'
    });

    (ragProvider.askRag as jest.Mock).mockResolvedValue({ message: 'RAG context' });
    
    // Simulate LLM and fallback failing
    (llmProvider.askLlm as jest.Mock).mockRejectedValue(new Error('LLM Offline'));

    const dummyImage = Buffer.from('dummy image data');
    const res = await request(app)
      .post('/api/assistant')
      .set('Authorization', authHeader)
      .attach('file', dummyImage, 'test.jpg');

    expect(res.status).toBe(502);
  });
});
