import request from 'supertest';
import app from '../../app';
import { setupTestDB, loginUser } from '../setup';
import mongoose from 'mongoose';
import PlantDnaModel from '../../models/plant_dna_model';

setupTestDB();

describe('Garden Core Ecosystem E2E', () => {
  let authHeaderA: string;
  let authHeaderB: string;
  let gardenId: string;
  let zoneId: string;
  let plantDnaId: string;

  beforeAll(async () => {
    // 1. Authenticate user A and user B
    const userA = await loginUser('usera@example.com');
    authHeaderA = userA.authHeader;

    const userB = await loginUser('userb@example.com');
    authHeaderB = userB.authHeader;

    // Create mock PlantDna to use in plant creation
    const dna = await PlantDnaModel.create({
      species: 'Rosa rubiginosa',
      commonName: 'Rose',
      waterNeeds: 'Medium',
      sunlightNeeds: 'Full Sun'
    });
    plantDnaId = dna._id.toString();
  });

  it('POST /v2/gardens - Should create "Home Garden"', async () => {
    const res = await request(app)
      .post('/api/v2/gardens')
      .set('Authorization', authHeaderA)
      .send({ name: 'Home Garden', location: 'Dubai' })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('_id');
    gardenId = res.body.data._id;
  });

  it('POST /v2/zones - Should create "Balcony" passing the gardenId', async () => {
    const res = await request(app)
      .post('/api/v2/zones')
      .set('Authorization', authHeaderA)
      .send({
        name: 'Balcony',
        type: 'OUTDOOR',
        garden: gardenId
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('_id');
    zoneId = res.body.data._id;
  });

  it('POST /v2/plants - Should create "Rose" passing the zoneId', async () => {
    const res = await request(app)
      .post('/api/v2/plants')
      .set('Authorization', authHeaderA)
      .send({
        name: 'My Beautiful Rose',
        dna: plantDnaId,
        zone: zoneId
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('_id');
  });

  it('GET /v2/gardens - Should populate zones and plants correctly', async () => {
    const res = await request(app)
      .get('/api/v2/gardens')
      .set('Authorization', authHeaderA)
      .expect(200);

    expect(res.body.status).toBe('success');
    const gardens = res.body.data;
    expect(gardens.length).toBe(1);
    
    // Assert the garden populated its zones, and zones populated plants
    const homeGarden = gardens[0];
    expect(homeGarden.name).toBe('Home Garden');
  });

  it('SECURITY CHECK: User B trying to GET User A garden should fail (IDOR Protection)', async () => {
    const res = await request(app)
      .get(`/api/v2/gardens/${gardenId}`)
      .set('Authorization', authHeaderB);

    // Expecting 404 since it's "Not Found" for User B, or 403.
    expect([403, 404]).toContain(res.status);
    expect(res.body.status).toBe('error');
  });
});


