import { PlantIdentificationService } from '../../../services/PlantIdentificationService';
import { PlantIdentificationRepository } from '../../../repositories/PlantIdentificationRepository';
import { PlantEmbeddingsService } from '../../../services/plant_embeddings_service';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

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
  let service: PlantIdentificationService;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GEMINI_API_KEY = 'test_key';
    service = new PlantIdentificationService();
  });

  it('PASS: Should identify an image and save history', async () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('fake-image-data'));

    const mockAiResponse = {
      text: JSON.stringify({
        scientificName: 'Monstera Deliciosa',
        plantName: 'Monstera',
        confidenceScore: 0.95
      })
    };

    const aiInstance = new GoogleGenAI({ apiKey: 'test' });
    (aiInstance.models.generateContent as jest.Mock).mockResolvedValueOnce(mockAiResponse);

    (PlantIdentificationRepository.prototype.create as jest.Mock).mockResolvedValueOnce({
      _id: 'history_1'
    });

    (PlantEmbeddingsService.searchSimilarPlants as jest.Mock).mockResolvedValueOnce([
      { nameEn: 'Monstera' }
    ]);

    const result = await service.identifyImage('user_1', 'path/to/image.jpg');

    expect(result.scientificName).toBe('Monstera Deliciosa');
    expect(result.confidenceScore).toBe(0.95);
    expect(result.libraryMatch?.nameEn).toBe('Monstera');
    expect(PlantIdentificationRepository.prototype.create).toHaveBeenCalled();
  });

  it('FAIL: Should throw if API key is missing', async () => {
    delete process.env.GEMINI_API_KEY;

    await expect(service.identifyImage('user_1', 'path/to/img.jpg')).rejects.toThrow('Plant identification failed: GEMINI_API_KEY is not configured');
  });

  it('FAIL: Should throw if AI response is invalid', async () => {
    (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('fake-image-data'));

    const aiInstance = new GoogleGenAI({ apiKey: 'test' });
    (aiInstance.models.generateContent as jest.Mock).mockResolvedValueOnce({ text: '' }); // Empty response

    await expect(service.identifyImage('user_1', 'path/to/img.jpg')).rejects.toThrow('Plant identification failed: No response from AI');
  });
});


