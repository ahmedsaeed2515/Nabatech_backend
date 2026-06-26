import request from 'supertest';
import app from '../../app';
import UserModel from '../../models/user_model';
import PlantIdentificationHistoryModel from '../../models/plant_identification_history_model';
import AiMemoryModel from '../../models/ai_memory_model';
import { createFakeUser } from '../factories';
import jwt from 'jsonwebtoken';
import fs from 'fs';

jest.mock('../../services/PlantIdentificationService', () => {
  return {
    PlantIdentificationService: jest.fn().mockImplementation(() => ({
      identifyImage: jest.fn().mockResolvedValue({
        identificationId: 'fake_id_123',
        species: 'Monstera Deliciosa',
        confidence: 0.98,
        category: 'Indoor',
        careSummary: 'Water weekly'
      }),
      getHistory: jest.fn().mockResolvedValue([
        { identifiedSpecies: 'Monstera Deliciosa', confidenceScore: 0.98 }
      ]),
      markAddedToGarden: jest.fn().mockResolvedValue({
        _id: 'fake_id_123',
        identifiedSpecies: 'Monstera Deliciosa'
      })
    }))
  };
});

describe('[INTEGRATION] Plant Identification Controller', () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await UserModel.create(createFakeUser());
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
    jest.clearAllMocks();
  });

  describe('POST /api/v1/plants/identify', () => {
    it('PASS: Should identify plant from image upload', async () => {
      // Create a dummy file for the test
      fs.writeFileSync('test_image.jpg', 'fake-image-data');

      const res = await request(app)
        .post('/api/v1/plants/identify')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', 'test_image.jpg');

      expect(res.status).toBe(200);
      expect(res.body.data.species).toBe('Monstera Deliciosa');
      expect(res.body.data.confidence).toBe(0.98);

      fs.unlinkSync('test_image.jpg');
    });

    it('FAIL: Should reject if no image attached', async () => {
      const res = await request(app)
        .post('/api/v1/plants/identify')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('No image uploaded');
    });
  });

  describe('GET /api/v1/plants/identify/history', () => {
    it('PASS: Should fetch identification history', async () => {
      const res = await request(app)
        .get('/api/v1/plants/identify/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0].identifiedSpecies).toBe('Monstera Deliciosa');
    });
  });

  describe('PUT /api/v1/plants/identify/:id/garden', () => {
    it('PASS: Should mark as added to garden and update AI memory', async () => {
      const res = await request(app)
        .put('/api/v1/plants/identify/fake_id_123/garden')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ species: 'Monstera Deliciosa' });

      expect(res.status).toBe(200);
      expect(res.body.message).toContain('updated AI memory');

      // Assert AI memory was updated
      const memories = await AiMemoryModel.find({ userId: userId.toString() });
      expect(memories.length).toBeGreaterThan(0);
      const latestMemory = memories[memories.length - 1];
      expect(latestMemory.value).toContain('User added a new plant');
    });
  });
});


