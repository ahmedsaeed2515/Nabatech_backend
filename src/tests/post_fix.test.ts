import { orchestrateAssistantRequest, orchestrateChat } from '../services/ai/ai_orchestrator_service';
import { retrieveRagChunks } from '../services/ai/rag_provider';
import axios from 'axios';
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('Post-Fix Validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TEST 1 — IMAGE DIAGNOSIS (Fallback cascade without raw chunks)', async () => {
    // Mock CNN success, but LLM failure to trigger the fallback logic
    mockedAxios.post.mockImplementation(async (url: string) => {
      if (url.includes('predict')) {
        return { data: { prediction: 'Apple_Scab', confidence: 0.8833 } };
      }
      if (url.includes('retrieve')) {
        return {
          data: {
            chunks: [
              { text: 'Apple Scab treatment in Hindi...', source: 'SARTHI_Advisory', score: 0.8 },
            ]
          }
        };
      }
      // Force LLM to fail
      throw new Error('LLM Provider Timeout');
    });

    const result = await orchestrateAssistantRequest({
      userId: 'user1',
      requestId: 'req1',
      language: 'en',
      question: 'What is this?',
      imageUrl: 'http://image.jpg'
    });

    // Verification 1: providerChain = [cnn, rag, cnn] because fallback used CNN
    expect(result.providerChain).toContain('cnn');
    
    // Verification 2: No raw chunks returned
    expect(result.message).not.toContain('Apple Scab treatment in Hindi');
    
    // Verification 3: No [Source:] text
    expect(result.message).not.toContain('[Source:');
    
    // Verification 4: Clean formatting
    expect(result.message).toContain('Disease Detected: **Apple Scab**');
    expect(result.message).toContain('Confidence: 88.33%');
  });

  it('TEST 2 — ARABIC USER (Language Contamination)', async () => {
    let capturedLang = '';
    mockedAxios.post.mockImplementation(async (url: string, data: any) => {
      if (url.includes('retrieve')) {
        capturedLang = data.language;
        return {
          data: { chunks: [] }
        };
      }
      return { data: {} };
    });

    try {
      await orchestrateChat({
        userId: 'user1',
        requestId: 'req2',
        language: 'ar',
        question: 'ما هو مرض هذا النبات؟',
        history: []
      });
    } catch(e) {}
    
    expect(capturedLang).toBe('ar');
  });

  it('TEST 3 — ENGLISH USER (Language Contamination)', async () => {
    let capturedLang = '';
    mockedAxios.post.mockImplementation(async (url: string, data: any) => {
      if (url.includes('retrieve')) {
        capturedLang = data.language;
        return {
          data: { chunks: [] }
        };
      }
      return { data: {} };
    });

    try {
      await orchestrateChat({
        userId: 'user1',
        requestId: 'req3',
        language: 'en',
        question: 'What disease is this plant suffering from?',
        history: []
      });
    } catch(e) {}
    
    expect(capturedLang).toBe('en');
  });
});


