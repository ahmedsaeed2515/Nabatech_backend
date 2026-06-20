import request from 'supertest';
import app from '../../app';
import mongoose from 'mongoose';
import UserModel from '../../models/user_model';
import { createFakeUser } from '../factories';

describe('[E2E] Full User Journey - Phase 9', () => {
  let authToken: string;
  let userId: string;
  let gardenId: string;
  let zoneId: string;
  let plantId: string;

  beforeAll(async () => {
    // E2E Tests would normally connect to a dedicated testing db instance
    // Here we rely on globalSetup for in-memory MongoDB
  });

  afterAll(async () => {
    // Cleanup handled by globalTeardown
  });

  it('1. User registers and logs in', async () => {
    const user = createFakeUser();
    const registerRes = await request(app).post('/api/auth/register').send({
      name: user.name, email: user.email, password: 'password123'
    });
    expect(registerRes.status).toBe(201);
    
    const loginRes = await request(app).post('/api/auth/login').send({
      email: user.email, password: 'password123'
    });
    expect(loginRes.status).toBe(200);
    authToken = loginRes.body.token;
    userId = loginRes.body.user._id;
  });

  it('2. User creates a garden and zone', async () => {
    const gardenRes = await request(app)
      .post('/api/v1/gardens')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ name: 'E2E Garden', type: 'OUTDOOR' });
    expect(gardenRes.status).toBe(201);
    gardenId = gardenRes.body.data._id;

    const zoneRes = await request(app)
      .post('/api/v1/zones')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ gardenId, name: 'E2E Zone', type: 'FULL_SUN' });
    expect(zoneRes.status).toBe(201);
    zoneId = zoneRes.body.data._id;
  });

  it('3. User adds a plant to the zone', async () => {
    const plantRes = await request(app)
      .post('/api/v1/plants')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ zone: zoneId, species: 'Tomato', name: 'My E2E Tomato', stage: 'Seedling' });
    expect(plantRes.status).toBe(201);
    plantId = plantRes.body.data._id;
  });

  it('4. User posts to community about their new plant', async () => {
    const postRes = await request(app)
      .post('/api/v1/posts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ content: 'Just planted my E2E Tomato!' });
    expect(postRes.status).toBe(201);
  });

  it('5. User receives daily tasks', async () => {
    // A mock task could be created by a service, we'll manually create one via Task API
    const taskRes = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Water Tomato', dueDate: new Date(), type: 'water', plantId });
    expect(taskRes.status).toBe(201);
  });

  it('6. User completes the task', async () => {
    const tasks = await request(app)
      .get(`/api/v1/tasks/daily?date=${new Date().toISOString()}`)
      .set('Authorization', `Bearer ${authToken}`);
    const taskId = tasks.body.data[0]._id;

    const completeRes = await request(app)
      .put(`/api/v1/tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('completed');
  });
});
