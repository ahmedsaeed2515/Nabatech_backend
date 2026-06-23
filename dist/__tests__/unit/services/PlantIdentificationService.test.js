"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const PlantIdentificationService_1 = require("../../../services/PlantIdentificationService");
const PlantIdentificationRepository_1 = require("../../../repositories/PlantIdentificationRepository");
const plant_embeddings_service_1 = require("../../../services/plant_embeddings_service");
const fs_1 = __importDefault(require("fs"));
const genai_1 = require("@google/genai");
jest.mock('fs');
jest.mock('../../../repositories/PlantIdentificationRepository');
jest.mock('../../../services/plant_embeddings_service');
jest.mock('@google/genai', () => {
    return {
        GoogleGenAI: jest.fn().mockImplementation(() => {
            return {
                models: {
                    generateContent: jest.fn()
                }
            };
        }),
        Type: {
            OBJECT: 'object',
            STRING: 'string',
            NUMBER: 'number'
        }
    };
});
describe('[UNIT] PlantIdentificationService', () => {
    let service;
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test_key';
        service = new PlantIdentificationService_1.PlantIdentificationService();
    });
    it('PASS: Should identify an image and save history', async () => {
        fs_1.default.readFileSync.mockReturnValue(Buffer.from('fake-image-data'));
        const mockAiResponse = {
            text: JSON.stringify({
                scientificName: 'Monstera Deliciosa',
                plantName: 'Monstera',
                confidenceScore: 0.95
            })
        };
        const aiInstance = new genai_1.GoogleGenAI({ apiKey: 'test' });
        aiInstance.models.generateContent.mockResolvedValueOnce(mockAiResponse);
        PlantIdentificationRepository_1.PlantIdentificationRepository.prototype.create.mockResolvedValueOnce({
            _id: 'history_1'
        });
        plant_embeddings_service_1.PlantEmbeddingsService.searchSimilarPlants.mockResolvedValueOnce([
            { nameEn: 'Monstera' }
        ]);
        const result = await service.identifyImage('user_1', 'path/to/image.jpg');
        expect(result.scientificName).toBe('Monstera Deliciosa');
        expect(result.confidenceScore).toBe(0.95);
        expect(result.libraryMatch?.nameEn).toBe('Monstera');
        expect(PlantIdentificationRepository_1.PlantIdentificationRepository.prototype.create).toHaveBeenCalled();
    });
    it('FAIL: Should throw if API key is missing', async () => {
        delete process.env.GEMINI_API_KEY;
        await expect(service.identifyImage('user_1', 'path/to/img.jpg')).rejects.toThrow('Plant identification failed: GEMINI_API_KEY is not configured');
    });
    it('FAIL: Should throw if AI response is invalid', async () => {
        fs_1.default.readFileSync.mockReturnValue(Buffer.from('fake-image-data'));
        const aiInstance = new genai_1.GoogleGenAI({ apiKey: 'test' });
        aiInstance.models.generateContent.mockResolvedValueOnce({ text: '' }); // Empty response
        await expect(service.identifyImage('user_1', 'path/to/img.jpg')).rejects.toThrow('Plant identification failed: No response from AI');
    });
});
