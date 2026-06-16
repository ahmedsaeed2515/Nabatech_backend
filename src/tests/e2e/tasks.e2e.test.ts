import request from 'supertest';
import app from '../../app';
import { setupTestDB, loginUser } from '../setup';
import PlantDnaModel from '../../models/plant_dna_model';
import GardenModel from '../../models/garden_model';
import ZoneModel, { ZoneType } from '../../models/zone_model';
import PlantModel, { PlantStage } from '../../models/plant_model';
import { TaskGenCron } from '../../crons/TaskGenCron';

setupTestDB();

describe('Tasks E2E', () => {
  let authHeader: string;
  let userId: string;
  let plantId: string;
  let taskId: string;

  beforeAll(async () => {
    const user = await loginUser('tasks@example.com');
    authHeader = user.authHeader;
    userId = user.user._id.toString();

    // Plant DNA with wateringFrequency = 2 days
    const dna = await PlantDnaModel.create({
      species: 'Ficus elastica',
      commonName: 'Rubber Plant',
      wateringFrequency: 2 
    } as any);

    const garden = await GardenModel.create({
      user: userId,
      name: 'Task Garden',
      location: 'Office'
    });

    const zone = await ZoneModel.create({
      user: userId,
      garden: garden._id,
      name: 'Desk',
      type: ZoneType.INDOOR
    });

    // Create a plant that was created 5 days ago (simulating last watered 5 days ago)
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

    const plant = await PlantModel.create({
      user: userId,
      zone: zone._id,
      dna: dna._id,
      name: 'Ruby',
      stage: PlantStage.VEGETATIVE,
      healthScore: 100,
      createdAt: fiveDaysAgo, // Using createdAt as fallback since no care actions exist
    });

    plantId = plant._id.toString();
  });

  it('Manually invoke TaskGenCron to generate a task', async () => {
    await TaskGenCron.execute();
    // No error should be thrown, and a task should be created
    expect(true).toBe(true);
  });

  it('GET /v2/tasks/daily - Should return the newly created PENDING water task', async () => {
    // We send a date today
    const dateQuery = new Date().toISOString().split('T')[0];
    
    const res = await request(app)
      .get(`/api/v2/tasks/daily?date=${dateQuery}`)
      .set('Authorization', authHeader)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data).toBeInstanceOf(Array);
    
    const tasks = res.body.data;
    expect(tasks.length).toBeGreaterThanOrEqual(1);

    const waterTask = tasks.find((t: any) => t.plant === plantId);
    expect(waterTask).toBeDefined();
    expect(waterTask.status).toBe('PENDING');
    
    taskId = waterTask._id;
  });

  it('PUT /v2/tasks/:id/complete - Should mark the task as COMPLETED', async () => {
    const res = await request(app)
      .put(`/api/v2/tasks/${taskId}/complete`)
      .set('Authorization', authHeader)
      .expect(200);

    expect(res.body.status).toBe('success');
    expect(res.body.data.status).toBe('COMPLETED');
  });
});
