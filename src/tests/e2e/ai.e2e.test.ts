import request from 'supertest';
import app from '../../app';
import { setupTestDB, loginUser } from '../setup';
import PlantModel, { PlantStage } from '../../models/plant_model';
import ZoneModel, { ZoneType } from '../../models/zone_model';
import GardenModel from '../../models/garden_model';
import PlantDnaModel from '../../models/plant_dna_model';
import { GoogleGenAI } from '@google/genai';

// 1. MOCK the Google Gemini SDK completely
jest.mock('@google/genai', () => {
  return {
    GoogleGenAI: jest.fn().mockImplementation(() => {
      return {
        models: {
          generateContent: jest.fn().mockResolvedValue({
            text: JSON.stringify({
              reply: "Here is your care advice for your Monstera.",
              detectedPlant: { name: 'Monstera', species: 'Monstera deliciosa' }
            })
          })
        }
      };
    }),
    Type: {
      OBJECT: 'OBJECT',
      STRING: 'STRING',
      ARRAY: 'ARRAY',
      INTEGER: 'INTEGER'
    }
  };
});

setupTestDB();

describe('AI Integrations E2E', () => {
  let authHeader: string;
  let userId: string;

  beforeAll(async () => {
    const user = await loginUser('ai@example.com');
    authHeader = user.authHeader;
    userId = user.user._id.toString();

    // Create a plant to test "Plant Memory"
    const dna = await PlantDnaModel.create({
      species: 'Monstera deliciosa',
      commonName: 'Swiss Cheese Plant',
    } as any);

    const garden = await GardenModel.create({
      user: userId,
      name: 'AI Garden',
      location: 'Living Room'
    });

    const zone = await ZoneModel.create({
      user: userId,
      garden: garden._id,
      name: 'AI Zone',
      type: ZoneType.INDOOR
    });

    await PlantModel.create({
      user: userId,
      zone: zone._id,
      dna: dna._id,
      name: 'Monty',
      stage: PlantStage.VEGETATIVE,
      healthScore: 90
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('POST /v2/chat - Should return mock reply and detectedPlant', async () => {
    const res = await request(app)
      .post('/api/v2/chat')
      .set('Authorization', authHeader)
      .send({
        message: 'How do I care for my Monstera?'
      })
      .expect(200);

    // 4. Assert that the response matches the expected structure
    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('reply', 'Here is your care advice for your Monstera.');
    expect(res.body.data).toHaveProperty('detectedPlant');
    expect(res.body.data.detectedPlant).toHaveProperty('name', 'Monstera');

    // 5. Ensure the mock was called with the injected Plant Memory
    // The mock is a singleton-like factory in jest, we can inspect its calls
    const mockInstance = (GoogleGenAI as jest.Mock).mock.results[0]?.value;
    expect(mockInstance).toBeDefined();
    
    const generateContentMock = mockInstance.models.generateContent;
    expect(generateContentMock).toHaveBeenCalled();
    
    const callArgs = generateContentMock.mock.calls[0][0];
    
    // Check that contents equal the message
    expect(callArgs.contents).toBe('How do I care for my Monstera?');
    
    // Check that systemInstruction contains the minified plant memory (e.g. 'Monty')
    expect(callArgs.config.systemInstruction).toMatch(/Monty/);
    expect(callArgs.config.systemInstruction).toMatch(/healthScore/);
  });
});


