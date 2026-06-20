import request from 'supertest';
import app from '../../app';
import UserModel from '../../models/user_model';
import MyPlantModel from '../../models/my_plant_model';
import ZoneModel from '../../models/zone_model';
import GardenModel from '../../models/garden_model';
import { createFakeUser } from '../factories';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

describe('[INTEGRATION] Plant Controller', () => {

  let authToken: string;
  let userId: string;
  let zoneId: string;

  beforeEach(async () => {
    const user = await UserModel.create(createFakeUser());
    userId = user._id.toString();
    authToken = jwt.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');

    const garden = await GardenModel.create({
      user: userId, name: 'Main Garden', type: 'OUTDOOR'
    });

    const zone = await ZoneModel.create({
      user: userId, garden: garden._id, name: 'Front Yard', type: 'FULL_SUN'
    });
    zoneId = zone._id.toString();
  });

  describe('POST /api/v1/plants', () => {
    it('يجب ينشئ نبات جديد ويرجعه', async () => {
      const res = await request(app)
        .post('/api/v1/plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          zone: zoneId,
          species: 'Tomato',
          name: 'My Red Tomato',
          growthStage: 'SEED',
          location: 'outdoor',
          waterFrequencyDays: 2
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('My Red Tomato');

      const plant = await MyPlantModel.findById(res.body.data._id);
      expect(plant).not.toBeNull();
      expect(plant!.species).toBe('Tomato');
    });

    it('يجب يرفض الطلب لو مفيش zone', async () => {
      const res = await request(app)
        .post('/api/v1/plants')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          species: 'Tomato',
          name: 'My Red Tomato',
        });

      expect(res.status).toBe(400); // Bad Request
    });
  });

  describe('GET /api/v1/plants', () => {
    it('يجب يرجع كل نباتات المستخدم', async () => {
      await MyPlantModel.create({
        user: userId, zone: zoneId, species: 'Basil', name: 'Basil 1', location: 'indoor', waterFrequencyDays: 2
      });
      await MyPlantModel.create({
        user: userId, zone: zoneId, species: 'Mint', name: 'Mint 1', location: 'indoor', waterFrequencyDays: 2
      });

      const res = await request(app)
        .get('/api/v1/plants')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });
  });

  describe('PUT /api/v1/plants/:id', () => {
    it('يجب يحدّث النبات بنجاح', async () => {
      const plant = await MyPlantModel.create({
        user: userId, zone: zoneId, species: 'Basil', name: 'Basil 1', location: 'indoor', waterFrequencyDays: 2
      });

      const res = await request(app)
        .put(`/api/v1/plants/${plant._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Basil'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe('Updated Basil');
    });
  });

  describe('DELETE /api/v1/plants/:id', () => {
    it('يجب يمسح النبات بنجاح', async () => {
      const plant = await MyPlantModel.create({
        user: userId, zone: zoneId, species: 'Basil', name: 'Basil 1', location: 'indoor', waterFrequencyDays: 2
      });

      const res = await request(app)
        .delete(`/api/v1/plants/${plant._id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      
      const checkPlant = await MyPlantModel.findById(plant._id);
      expect(checkPlant).toBeNull();
    });
  });
});
