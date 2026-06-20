"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const app_1 = __importDefault(require("../../app"));
const user_model_1 = __importDefault(require("../../models/user_model"));
const task_model_1 = __importStar(require("../../models/task_model"));
const factories_1 = require("../factories");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
describe('[INTEGRATION] Task Controller (V2) - Phase 4', () => {
    let authToken;
    let userId;
    beforeEach(async () => {
        const user = await user_model_1.default.create((0, factories_1.createFakeUser)());
        userId = user._id.toString();
        authToken = jsonwebtoken_1.default.sign({ id: userId }, process.env.JWT_SECRET || 'test-secret');
        jest.clearAllMocks();
    });
    describe('Tasks CRUD & Complete', () => {
        it('PASS: Create Task', async () => {
            const res = await (0, supertest_1.default)(app_1.default)
                .post('/api/v1/tasks')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: 'Water the Basil',
                dueDate: new Date().toISOString()
            });
            expect(res.status).toBe(201);
            expect(res.body.data.title).toBe('Water the Basil');
            expect(res.body.data.status).toBe(task_model_1.TaskStatus.PENDING);
        });
        it('PASS: Get Daily Tasks', async () => {
            const today = new Date();
            await task_model_1.default.create({
                user: userId,
                title: 'Daily Check',
                dueDate: today,
                status: task_model_1.TaskStatus.PENDING
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .get(`/api/v1/tasks/daily?date=${today.toISOString()}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.length).toBeGreaterThanOrEqual(1);
            expect(res.body.data[0].title).toBe('Daily Check');
        });
        it('PASS: Update Task', async () => {
            const task = await task_model_1.default.create({
                user: userId,
                title: 'Old Title',
                dueDate: new Date(),
                status: task_model_1.TaskStatus.PENDING
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/tasks/${task._id}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                title: 'New Title'
            });
            expect(res.status).toBe(200);
            expect(res.body.data.title).toBe('New Title');
        });
        it('PASS: Delete Task', async () => {
            const task = await task_model_1.default.create({
                user: userId,
                title: 'To Be Deleted',
                dueDate: new Date(),
                status: task_model_1.TaskStatus.PENDING
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .delete(`/api/v1/tasks/${task._id}`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            const check = await task_model_1.default.findById(task._id);
            expect(check).toBeNull(); // Hard deleted as per service implementation
        });
        it('PASS: Complete Task', async () => {
            const task = await task_model_1.default.create({
                user: userId,
                title: 'To Be Completed',
                dueDate: new Date(),
                status: task_model_1.TaskStatus.PENDING
            });
            const res = await (0, supertest_1.default)(app_1.default)
                .put(`/api/v1/tasks/${task._id}/complete`)
                .set('Authorization', `Bearer ${authToken}`);
            expect(res.status).toBe(200);
            expect(res.body.data.status).toBe(task_model_1.TaskStatus.COMPLETED);
            const check = await task_model_1.default.findById(task._id);
            expect(check?.status).toBe(task_model_1.TaskStatus.COMPLETED);
        });
    });
});
