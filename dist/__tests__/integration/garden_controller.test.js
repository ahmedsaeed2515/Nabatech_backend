"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const user_model_1 = __importDefault(require("../../models/user_model"));
const garden_model_1 = __importDefault(require("../../models/garden_model"));
const zone_model_1 = __importDefault(require("../../models/zone_model"));
const factories_1 = require("../factories");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('[INTEGRATION] Garden System Controller (Gardens & Zones) - Phase 2', () => {
    let authToken;
    let userId;
    beforeEach(async () => {
        const user = await user_model_1.default.create((0, factories_1.createFakeUser)());
        userId = user._id.toString();
        authToken = jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
        jest.clearAllMocks();
    });
    describe('Gardens CRUD', () => {
        it('PASS: Create Garden', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
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
            await garden_model_1.default.create({ user: userId, name: 'Garden 1', type: 'INDOOR' });
            await garden_model_1.default.create({ user: userId, name: 'Garden 2', type: 'BALCONY' });
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/gardens')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(2);
        });
        it('PASS: Update Garden', async () => {
            const garden = await garden_model_1.default.create({ user: userId, name: 'Old Name', type: 'INDOOR' });
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/gardens/${garden._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                name: 'New Name'
            });
            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('New Name');
        });
        it('PASS: Delete Garden', async () => {
            const garden = await garden_model_1.default.create({ user: userId, name: 'To Delete', type: 'INDOOR' });
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/gardens/${garden._id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            const check = await garden_model_1.default.findById(garden._id);
            expect(check).toBeNull();
        });
    });
    describe('Zones CRUD', () => {
        let gardenId;
        beforeEach(async () => {
            const garden = await garden_model_1.default.create({ user: userId, name: 'Zone Test Garden', type: 'OUTDOOR' });
            gardenId = garden._id.toString();
        });
        it('PASS: Create Zone', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
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
            await zone_model_1.default.create({ user: userId, garden: gardenId, name: 'Zone 1', type: 'PARTIAL_SHADE' });
            await zone_model_1.default.create({ user: userId, garden: gardenId, name: 'Zone 2', type: 'FULL_SHADE' });
            const res = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/zones?gardenId=${gardenId}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBe(2);
        });
        it('PASS: Update Zone', async () => {
            const zone = await zone_model_1.default.create({ user: userId, garden: gardenId, name: 'Old Zone Name', type: 'FULL_SUN' });
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/zones/${zone._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                name: 'Updated Zone Name'
            });
            expect(res.status).toBe(200);
            expect(res.body.data.name).toBe('Updated Zone Name');
        });
        it('PASS: Delete Zone', async () => {
            const zone = await zone_model_1.default.create({ user: userId, garden: gardenId, name: 'To Delete Zone', type: 'FULL_SUN' });
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/zones/${zone._id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            const check = await zone_model_1.default.findById(zone._id);
            expect(check).toBeNull();
        });
    });
});
