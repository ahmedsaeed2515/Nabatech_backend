"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const plant_embeddings_service_1 = require("../../../services/plant_embeddings_service");
const plant_model_1 = __importDefault(require("../../../models/plant_model"));
jest.mock('../../../models/plant_model');
jest.mock('@google/genai', () => {
    return {
        GoogleGenAI: jest.fn().mockImplementation(() => {
            return {
                models: {
                    embedContent: jest.fn().mockResolvedValue({
                        embeddings: [{ values: [0.1, 0.2, 0.3] }]
                    })
                }
            };
        })
    };
});
describe('[UNIT] PlantEmbeddingsService - Phase 7', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GEMINI_API_KEY = 'test_key';
    });
    it('PASS: Should generate embedding and save to plant', async () => {
        const mockSave = jest.fn();
        plant_model_1.default.findById.mockResolvedValueOnce({
            nameEn: 'Test Plant',
            scientificName: 'Test Sci',
            category: 'Test Cat',
            careLevel: 'Easy',
            save: mockSave
        });
        await plant_embeddings_service_1.PlantEmbeddingsService.generateEmbeddingForPlant('plant_1');
        expect(plant_model_1.default.findById).toHaveBeenCalledWith('plant_1');
        expect(mockSave).toHaveBeenCalled();
    });
    it('PASS: Should search similar plants using vector search', async () => {
        plant_model_1.default.aggregate.mockResolvedValueOnce([{ _id: 'plant_2', nameEn: 'Similar Plant' }]);
        const results = await plant_embeddings_service_1.PlantEmbeddingsService.searchSimilarPlants('I need an easy plant', 5);
        expect(results.length).toBe(1);
        expect(results[0].nameEn).toBe('Similar Plant');
        expect(plant_model_1.default.aggregate).toHaveBeenCalledWith(expect.arrayContaining([
            expect.objectContaining({
                $vectorSearch: expect.any(Object)
            })
        ]));
    });
});
