import request from 'supertest';
import app from '../../app';
import UserModel from '../../models/user_model';
import GardenModel from '../../models/garden_model';
import ZoneModel from '../../models/zone_model';
import { createFakeUser } from '../factories';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

describe('[INTEGRATION] Garden System Controller (Gardens & Zones) - Phase 2', () => {

  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const user = await UserModel.create(createFakeUser());
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
    jest.clearAllMocks();
  });

  describe('Gardens CRUD', () => {
    it('PASS: Create Garden', async () => {
      const res = await request(app)
        .post('/api/v1/gardens')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'My New Garden',
          type: 'OUTDOOR'
        });

      expect(res.status).toBe(201);
      expect(res.body.success || res.body.status === 'success').toBe(true);
      expect(res.body.data.name).toBe('My New Garden');
    });

    it('PASS: Get Gardens', async () => {
      await GardenModel.create({ user: userId, name: 'Garden 1', type: 'INDOOR' });
      await GardenModel.create({ user: userId, name: 'Garden 2', type: 'BALCONY' });

      const res = await request(app)
        .get('/api/v1/gardens')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('PASS: Update Garden', async () => {
      const garden = await GardenModel.create({ user: userId, name: 'Old Name', type: 'INDOOR' });

      const res = await request(app)
        .put(`/api/v1/gardens/${garden._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'New Name'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('New Name');
    });

    it('PASS: Delete Garden', async () => {
      const garden = await GardenModel.create({ user: userId, name: 'To Delete', type: 'INDOOR' });

      const res = await request(app)
        .delete(`/api/v1/gardens/${garden._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      
      const check = await GardenModel.findById(garden._id);
      expect(check).toBeNull();
    });
  });

  describe('Zones CRUD', () => {
    let gardenId: string;

    beforeEach(async () => {
      const garden = await GardenModel.create({ user: userId, name: 'Zone Test Garden', type: 'OUTDOOR' });
      gardenId = garden._id.toString();
    });

    it('PASS: Create Zone', async () => {
      const res = await request(app)
        .post('/api/v1/zones')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          gardenId: gardenId,
          name: 'Sunlight Area',
          type: 'FULL_SUN'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe('Sunlight Area');
    });

    it('PASS: Get Zones by Garden', async () => {
      await ZoneModel.create({ user: userId, garden: gardenId, name: 'Zone 1', type: 'PARTIAL_SHADE' });
      await ZoneModel.create({ user: userId, garden: gardenId, name: 'Zone 2', type: 'FULL_SHADE' });

      const res = await request(app)
        .get(`/api/v1/zones?gardenId=${gardenId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
    });

    it('PASS: Update Zone', async () => {
      const zone = await ZoneModel.create({ user: userId, garden: gardenId, name: 'Old Zone Name', type: 'FULL_SUN' });

      const res = await request(app)
        .put(`/api/v1/zones/${zone._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Zone Name'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Zone Name');
    });

    it('PASS: Delete Zone', async () => {
      const zone = await ZoneModel.create({ user: userId, garden: gardenId, name: 'To Delete Zone', type: 'FULL_SUN' });

      const res = await request(app)
        .delete(`/api/v1/zones/${zone._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      
      const check = await ZoneModel.findById(zone._id);
      expect(check).toBeNull();
    });
  });
});


