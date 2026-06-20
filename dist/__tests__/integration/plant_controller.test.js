"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const user_model_1 = __importDefault(require("../../models/user_model"));
const my_plant_model_1 = __importDefault(require("../../models/my_plant_model"));
const zone_model_1 = __importDefault(require("../../models/zone_model"));
const garden_model_1 = __importDefault(require("../../models/garden_model"));
const factories_1 = require("../factories");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('[INTEGRATION] Plant Controller', () => {
    let authToken;
    let userId;
    let zoneId;
    beforeEach(async () => {
        const user = await user_model_1.default.create((0, factories_1.createFakeUser)());
        userId = user._id.toString();
        authToken = jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
        const garden = await garden_model_1.default.create({
            user: userId, name: 'Main Garden', type: 'OUTDOOR'
        });
        const zone = await zone_model_1.default.create({
            user: userId, garden: garden._id, name: 'Front Yard', type: 'FULL_SUN'
        });
        zoneId = zone._id.toString();
    });
    describe('POST /api/v1/plants', () => {
        it('يجب ينشئ نبات جديد ويرجعه', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
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
            const plant = await my_plant_model_1.default.findById(res.body.data._id);
            expect(plant).not.toBeNull();
            expect(plant.species).toBe('Tomato');
        });
        it('يجب يرفض الطلب لو مفيش zone', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
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
            await my_plant_model_1.default.create({
                user: userId, zone: zoneId, species: 'Basil', name: 'Basil 1', location: 'indoor', waterFrequencyDays: 2
            });
            await my_plant_model_1.default.create({
                user: userId, zone: zoneId, species: 'Mint', name: 'Mint 1', location: 'indoor', waterFrequencyDays: 2
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/plants')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.success).toBe(true);
            expect(res.body.data.length).toBe(2);
        });
    });
    describe('PUT /api/v1/plants/:id', () => {
        it('يجب يحدّث النبات بنجاح', async () => {
            const plant = await my_plant_model_1.default.create({
                user: userId, zone: zoneId, species: 'Basil', name: 'Basil 1', location: 'indoor', waterFrequencyDays: 2
            });
            const res = await (0, supertest_1.default)(app_1.default)
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
            const plant = await my_plant_model_1.default.create({
                user: userId, zone: zoneId, species: 'Basil', name: 'Basil 1', location: 'indoor', waterFrequencyDays: 2
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/plants/${plant._id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            const checkPlant = await my_plant_model_1.default.findById(plant._id);
            expect(checkPlant).toBeNull();
        });
    });
});
