"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const user_model_1 = __importDefault(require("../../models/user_model"));
const ai_memory_model_1 = __importDefault(require("../../models/ai_memory_model"));
const factories_1 = require("../factories");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const fs_1 = __importDefault(require("fs"));
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
    let authToken;
    let userId;
    beforeEach(async () => {
        const user = await user_model_1.default.create((0, factories_1.createFakeUser)());
        userId = user._id.toString();
        authToken = jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
        jest.clearAllMocks();
    });
    describe('POST /api/v1/plants/identify', () => {
        it('PASS: Should identify plant from image upload', async () => {
            // Create a dummy file for the test
            fs_1.default.writeFileSync('test_image.jpg', 'fake-image-data');
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/plants/identify')
                .set('Authorization', `Bearer ${authToken}`)
                .attach('image', 'test_image.jpg');
            expect(res.status).toBe(200);
            expect(res.body.data.species).toBe('Monstera Deliciosa');
            expect(res.body.data.confidence).toBe(0.98);
            fs_1.default.unlinkSync('test_image.jpg');
        });
        it('FAIL: Should reject if no image attached', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/plants/identify')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(400);
            expect(res.body.message).toBe('No image uploaded');
        });
    });
    describe('GET /api/v1/plants/identify/history', () => {
        it('PASS: Should fetch identification history', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .get('/api/v1/plants/identify/history')
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThan(0);
            expect(res.body.data[0].identifiedSpecies).toBe('Monstera Deliciosa');
        });
    });
    describe('PUT /api/v1/plants/identify/:id/garden', () => {
        it('PASS: Should mark as added to garden and update AI memory', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .put('/api/v1/plants/identify/fake_id_123/garden')
                .set('Authorization', `Bearer ${authToken}`)
                .send({ species: 'Monstera Deliciosa' });
            expect(res.status).toBe(200);
            expect(res.body.message).toContain('updated AI memory');
            // Assert AI memory was updated
            const memories = await ai_memory_model_1.default.find({ userId: userId.toString() });
            expect(memories.length).toBeGreaterThan(0);
            const latestMemory = memories[memories.length - 1];
            expect(latestMemory.value).toContain('User added a new plant');
        });
    });
});
