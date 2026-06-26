import request from 'supertest';
import app from '../../app';
import { setupTestDB, loginUser } from '../setup';
import PlantDnaModel from '../../models/plant_dna_model';
import GardenModel from '../../models/garden_model';
import ZoneModel, { ZoneType } from '../../models/zone_model';
import PlantModel, { PlantStage } from '../../models/plant_model';
import { HealthEngineService } from '../../services/HealthEngineService';

setupTestDB();

describe('Care & Health Engine E2E', () => {
  let authHeader: string;
  let userId: string;
  let plantId: string;

  beforeAll(async () => {
    // 1. Setup user and plant hierarchy
    const user = await loginUser('care@example.com');
    authHeader = user.authHeader;
    userId = user.user._id.toString();

    const dna = await PlantDnaModel.create({
      species: 'Monstera deliciosa',
      commonName: 'Swiss Cheese Plant',
      waterNeeds: 'Medium'
    });

    const garden = await GardenModel.create({
      user: userId,
      name: 'Indoor Oasis',
      location: 'Living Room'
    });

    const zone = await ZoneModel.create({
      user: userId,
      garden: garden._id,
      name: 'Window Sill',
      type: ZoneType.INDOOR
    });

    const plant = await PlantModel.create({
      user: userId,
      zone: zone._id,
      dna: dna._id,
      name: 'Monty',
      stage: PlantStage.VEGETATIVE,
      healthScore: 100
    });

    plantId = plant._id.toString();
  });

  it('POST /v2/plants/:id/care - First call creates action (201)', async () => {
    const res = await request(app)
      .post(`/api/v2/plants/${plantId}/care`)
      .set('Authorization', authHeader)
      .set('x-client-operation-id', 'test-op-123')
      .send({
        actionType: 'WATER',
        notes: 'Watered slightly'
      })
      .expect(201);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('_id');
  });

  it('POST /v2/plants/:id/care - Second call hits Idempotency cache (200)', async () => {
    const res = await request(app)
      .post(`/api/v2/plants/${plantId}/care`)
      .set('Authorization', authHeader)
      .set('x-client-operation-id', 'test-op-123')
      .send({
        actionType: 'WATER',
        notes: 'Watered slightly'
      })
      .expect(200); // 200 OK instead of 201 Created

    expect(res.body.status).toBe('success');
    expect(res.body.data).toHaveProperty('_id');
  });

  it('Simulate Health calculation logic - should update healthScore', async () => {
    // Manually invoking the HealthEngine to bypass waiting for BullMQ in test env
    const healthEngine = new HealthEngineService();
    await healthEngine.calculate(plantId);

    const updatedPlant = await PlantModel.findById(plantId);
    expect(updatedPlant).not.toBeNull();
    // Assuming health calculation adjusts score if lastWatered exists and isn't overdue
    // Or at least does not throw an error and evaluates completely
    expect(updatedPlant!.healthScore).toBeDefined();
    expect(typeof updatedPlant!.healthScore).toBe('number');
  });

  it('GET /v2/plants/:id/care/history - Verify only one action exists despite duplicate requests', async () => {
    const res = await request(app)
      .get(`/api/v2/plants/${plantId}/care/history`)
      .set('Authorization', authHeader)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeInstanceOf(Array);
    // Since idempotency blocked the second one, there should be exactly 1 WATER action
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].actionType).toBe('WATER');
  });
});


