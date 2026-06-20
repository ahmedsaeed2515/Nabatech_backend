"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const factories_1 = require("../factories");
describe('[E2E] Full User Journey - Phase 9', () => {
    let authToken;
    let userId;
    let gardenId;
    let zoneId;
    let plantId;
    beforeAll(async () => {
        // E2E Tests would normally connect to a dedicated testing db instance
        // Here we rely on globalSetup for in-memory MongoDB
    });
    afterAll(async () => {
        // Cleanup handled by globalTeardown
    });
    it('1. User registers and logs in', async () => {
        const user = (0, factories_1.createFakeUser)();
        const registerRes = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
            name: user.name, email: user.email, password: 'password123'
        });
        expect(registerRes.status).toBe(201);
        const loginRes = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
            email: user.email, password: 'password123'
        });
        expect(loginRes.status).toBe(200);
        authToken = loginRes.body.token;
        userId = loginRes.body.user._id;
    });
    it('2. User creates a garden and zone', async () => {
        const gardenRes = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/gardens')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ name: 'E2E Garden', type: 'OUTDOOR' });
        expect(gardenRes.status).toBe(201);
        gardenId = gardenRes.body.data._id;
        const zoneRes = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/zones')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ gardenId, name: 'E2E Zone', type: 'FULL_SUN' });
        expect(zoneRes.status).toBe(201);
        zoneId = zoneRes.body.data._id;
    });
    it('3. User adds a plant to the zone', async () => {
        const plantRes = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/plants')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ zone: zoneId, species: 'Tomato', name: 'My E2E Tomato', stage: 'Seedling' });
        expect(plantRes.status).toBe(201);
        plantId = plantRes.body.data._id;
    });
    it('4. User posts to community about their new plant', async () => {
        const postRes = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/posts')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ content: 'Just planted my E2E Tomato!' });
        expect(postRes.status).toBe(201);
    });
    it('5. User receives daily tasks', async () => {
        // A mock task could be created by a service, we'll manually create one via Task API
        const taskRes = await (0, supertest_1.default)(app_1.default)
            .post('/api/v1/tasks')
            .set('Authorization', `Bearer ${authToken}`)
            .send({ title: 'Water Tomato', dueDate: new Date(), type: 'water', plantId });
        expect(taskRes.status).toBe(201);
    });
    it('6. User completes the task', async () => {
        const tasks = await (0, supertest_1.default)(app_1.default)
            .get(`/api/v1/tasks/daily?date=${new Date().toISOString()}`)
            .set('Authorization', `Bearer ${authToken}`);
        const taskId = tasks.body.data[0]._id;
        const completeRes = await (0, supertest_1.default)(app_1.default)
            .put(`/api/v1/tasks/${taskId}/complete`)
            .set('Authorization', `Bearer ${authToken}`);
        expect(completeRes.status).toBe(200);
        expect(completeRes.body.data.status).toBe('completed');
    });
});
