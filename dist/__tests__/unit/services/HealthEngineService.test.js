"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const HealthEngineService_1 = require("../../../services/HealthEngineService");
const care_action_model_1 = require("../../../models/care_action_model");
const mongoose_1 = __importDefault(require("mongoose"));
// Mock the repositories
jest.mock('../../../repositories/PlantHealthLogRepository');
jest.mock('../../../repositories/CareActionRepository');
jest.mock('../../../repositories/FertilizerLogRepository');
jest.mock('../../../repositories/PlantRepository');
describe('[UNIT] HealthEngineService', () => {
    let healthEngineService;
    let mockPlantRepo;
    let mockCareRepo;
    let mockFertRepo;
    let mockHealthRepo;
    const userId = new mongoose_1.default.Types.ObjectId().toString();
    const plantId = new mongoose_1.default.Types.ObjectId().toString();
    beforeEach(() => {
        jest.clearAllMocks();
        healthEngineService = new HealthEngineService_1.HealthEngineService();
        // Access the mocked instances
        mockPlantRepo = healthEngineService.plantRepo;
        mockCareRepo = healthEngineService.careRepo;
        mockFertRepo = healthEngineService.fertRepo;
        mockHealthRepo = healthEngineService.healthRepo;
    });
    describe('calculate', () => {
        it('يجب يرمي خطأ لو النبات مش موجود', async () => {
            mockPlantRepo.findOne.mockResolvedValue(null);
            await expect(healthEngineService.calculate(plantId, userId)).rejects.toThrow('Plant not found');
        });
        it('يجب يخصم 10 درجات لو مفيش ري من 7 أيام', async () => {
            const mockPlant = { _id: plantId, user: userId, healthScore: 100, save: jest.fn() };
            mockPlantRepo.findOne.mockResolvedValue(mockPlant);
            // No recent watering
            const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
            mockCareRepo.findByPlantId.mockResolvedValue([
                { type: care_action_model_1.CareActionType.WATER, date: eightDaysAgo }
            ]);
            mockFertRepo.findByPlantId.mockResolvedValue([]);
            const score = await healthEngineService.calculate(plantId, userId);
            expect(score).toBe(90); // 100 - 10
            expect(mockHealthRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                score: 90,
                issues: ['Overdue watering']
            }));
            expect(mockPlant.save).toHaveBeenCalled();
            expect(mockPlant.healthScore).toBe(90);
        });
        it('يجب يضيف 5 درجات لو فيه تسميد خلال 30 يوم بس مش أكتر من 100', async () => {
            const mockPlant = { _id: plantId, user: userId, healthScore: 100, save: jest.fn() };
            mockPlantRepo.findOne.mockResolvedValue(mockPlant);
            // Recent watering (so no penalty)
            mockCareRepo.findByPlantId.mockResolvedValue([
                { type: care_action_model_1.CareActionType.WATER, date: new Date().toISOString() }
            ]);
            // Recent fertilizer
            mockFertRepo.findByPlantId.mockResolvedValue([
                { date: new Date().toISOString() }
            ]);
            const score = await healthEngineService.calculate(plantId, userId);
            expect(score).toBe(100); // 100 + 5 max 100
            expect(mockHealthRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                score: 100,
                issues: []
            }));
        });
        it('يجب يحسب 95 لو مفيش ري بس فيه تسميد', async () => {
            const mockPlant = { _id: plantId, user: userId, healthScore: 100, save: jest.fn() };
            mockPlantRepo.findOne.mockResolvedValue(mockPlant);
            // No recent watering
            mockCareRepo.findByPlantId.mockResolvedValue([]);
            // Recent fertilizer
            mockFertRepo.findByPlantId.mockResolvedValue([
                { date: new Date().toISOString() }
            ]);
            const score = await healthEngineService.calculate(plantId, userId);
            expect(score).toBe(95); // 100 - 10 + 5
            expect(mockHealthRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                score: 95,
                issues: ['Overdue watering']
            }));
        });
    });
});
