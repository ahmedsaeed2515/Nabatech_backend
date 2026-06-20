"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app")); // Your Express app
const user_model_1 = __importDefault(require("../../models/user_model"));
const factories_1 = require("../factories");
const bcryptjs_1 = __importDefault(require("bcryptjs")); // Using bcryptjs as in your package.json
describe('[INTEGRATION] Auth API', () => {
    describe('POST /api/auth/register', () => {
        it('يجب ينجح ويرجع tokens لو بيانات صح', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
                name: 'Ahmed Test',
                email: 'ahmed.test@nabatech.com',
                password: 'SecurePass123!',
                role: 'user',
                country: 'Egypt'
            });
            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('refreshToken');
            expect(res.body.user.email).toBe('ahmed.test@nabatech.com');
            // Password must NOT be returned
            expect(res.body.user.password).toBeUndefined();
        });
        it('يجب يرفض email مكرر', async () => {
            await user_model_1.default.create({
                ...(0, factories_1.createFakeUser)(),
                email: 'duplicate@test.com'
            });
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
                name: 'Someone',
                email: 'duplicate@test.com',
                password: 'Pass123!',
                role: 'user'
            });
            expect(res.status).toBe(409);
        });
        it('يجب يرفض password ضعيف', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/register').send({
                name: 'Test',
                email: 'new@test.com',
                password: '123'
            });
            expect(res.status).toBe(400);
        });
    });
    describe('POST /api/auth/login', () => {
        beforeEach(async () => {
            const hashed = await bcryptjs_1.default.hash('TestPass123!', 10);
            await user_model_1.default.create({ ...(0, factories_1.createFakeUser)(), email: 'login@test.com', password: hashed });
        });
        it('يجب يرجع JWT tokens لو credentials صح', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: 'login@test.com',
                password: 'TestPass123!'
            });
            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
        });
        it('يجب يرجع 401 لو password غلط', async () => {
            const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/login').send({
                email: 'login@test.com',
                password: 'WrongPassword'
            });
            expect(res.status).toBe(401);
        });
    });
});
