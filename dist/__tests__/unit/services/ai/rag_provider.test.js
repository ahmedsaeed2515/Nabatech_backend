"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const rag_provider_1 = require("../../../services/ai/rag_provider");
const axios_1 = __importDefault(require("axios"));
jest.mock('axios');
describe('[UNIT] RAG Provider - Phase 7', () => {
    const mockSettings = {
        rag: {
            enabled: true,
            endpointUrl: 'http://test-rag.com/ask',
            timeoutMs: 5000,
            topK: 5
        },
        secrets: {
            ragApiKey: 'test_rag_key'
        }
    };
    beforeEach(() => {
        jest.clearAllMocks();
    });
    it('PASS: Should retrieve and format RAG chunks', async () => {
        axios_1.default.post.mockResolvedValueOnce({
            data: {
                chunks: [
                    { text: 'This is a long enough text chunk about plant disease.', source: 'Doc1', score: 0.9 },
                    { text: 'Another valid chunk here.', source: 'Doc2', score: 0.8 }
                ],
                total_found: 2
            }
        });
        const result = await (0, rag_provider_1.retrieveRagChunks)(mockSettings, 'Tomato Blight', 'How to treat?');
        expect(result.chunks.length).toBe(2);
        expect(result.contextText).toContain('Doc1');
        expect(result.contextText).toContain('Doc2');
        expect(axios_1.default.post).toHaveBeenCalled();
    });
    it('FAIL: Should throw if RAG is disabled', async () => {
        const disabledSettings = { ...mockSettings, rag: { enabled: false } };
        await expect((0, rag_provider_1.retrieveRagChunks)(disabledSettings, 'Disease')).rejects.toThrow('RAG disabled');
    });
    it('FAIL: Should throw if API fails', async () => {
        axios_1.default.post.mockRejectedValueOnce(new Error('Network error'));
        await expect((0, rag_provider_1.retrieveRagChunks)(mockSettings, 'Disease')).rejects.toThrow('RAG_UPSTREAM_FAILED');
    });
    it('FAIL: Should throw if response is empty', async () => {
        axios_1.default.post.mockResolvedValueOnce({ data: { chunks: [] } });
        await expect((0, rag_provider_1.retrieveRagChunks)(mockSettings, 'Disease')).rejects.toThrow('RAG_EMPTY_RESPONSE');
    });
});
