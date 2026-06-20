import { PlantEmbeddingsService } from '../../../services/plant_embeddings_service';
import Plant from '../../../models/plant_model';
import { GoogleGenAI } from '@google/genai';

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
    (Plant.findById as jest.Mock).mockResolvedValueOnce({
      nameEn: 'Test Plant',
      scientificName: 'Test Sci',
      category: 'Test Cat',
      careLevel: 'Easy',
      save: mockSave
    });

    await PlantEmbeddingsService.generateEmbeddingForPlant('plant_1');

    expect(Plant.findById).toHaveBeenCalledWith('plant_1');
    expect(mockSave).toHaveBeenCalled();
  });

  it('PASS: Should search similar plants using vector search', async () => {
    (Plant.aggregate as jest.Mock).mockResolvedValueOnce([{ _id: 'plant_2', nameEn: 'Similar Plant' }]);

    const results = await PlantEmbeddingsService.searchSimilarPlants('I need an easy plant', 5);

    expect(results.length).toBe(1);
    expect(results[0].nameEn).toBe('Similar Plant');
    expect(Plant.aggregate).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          $vectorSearch: expect.any(Object)
        })
      ])
    );
  });
});
