import { HealthEngineService } from '../../../services/HealthEngineService';
import { PlantHealthLogRepository } from '../../../repositories/PlantHealthLogRepository';
import { CareActionRepository } from '../../../repositories/CareActionRepository';
import { FertilizerLogRepository } from '../../../repositories/FertilizerLogRepository';
import { PlantRepository } from '../../../repositories/PlantRepository';
import { CareActionType } from '../../../models/care_action_model';
import mongoose from 'mongoose';

// Mock the repositories
jest.mock('../../../repositories/PlantHealthLogRepository');
jest.mock('../../../repositories/CareActionRepository');
jest.mock('../../../repositories/FertilizerLogRepository');
jest.mock('../../../repositories/PlantRepository');

describe('[UNIT] HealthEngineService', () => {
  let healthEngineService: HealthEngineService;
  let mockPlantRepo: jest.Mocked<PlantRepository>;
  let mockCareRepo: jest.Mocked<CareActionRepository>;
  let mockFertRepo: jest.Mocked<FertilizerLogRepository>;
  let mockHealthRepo: jest.Mocked<PlantHealthLogRepository>;

  const userId = new mongoose.Types.ObjectId().toString();
  const plantId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();

    healthEngineService = new HealthEngineService();
    
    // Access the mocked instances
    mockPlantRepo = (healthEngineService as any).plantRepo;
    mockCareRepo = (healthEngineService as any).careRepo;
    mockFertRepo = (healthEngineService as any).fertRepo;
    mockHealthRepo = (healthEngineService as any).healthRepo;
  });

  describe('calculate', () => {
    it('يجب يرمي خطأ لو النبات مش موجود', async () => {
      mockPlantRepo.findOne.mockResolvedValue(null);

      await expect(healthEngineService.calculate(plantId, userId)).rejects.toThrow('Plant not found');
    });

    it('يجب يخصم 10 درجات لو مفيش ري من 7 أيام', async () => {
      const mockPlant = { _id: plantId, user: userId, healthScore: 100, save: jest.fn() };
      mockPlantRepo.findOne.mockResolvedValue(mockPlant as any);
      
      // No recent watering
      const eightDaysAgo = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
      mockCareRepo.findByPlantId.mockResolvedValue([
        { type: CareActionType.WATER, date: eightDaysAgo } as any
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
      mockPlantRepo.findOne.mockResolvedValue(mockPlant as any);
      
      // Recent watering (so no penalty)
      mockCareRepo.findByPlantId.mockResolvedValue([
        { type: CareActionType.WATER, date: new Date().toISOString() } as any
      ]);
      
      // Recent fertilizer
      mockFertRepo.findByPlantId.mockResolvedValue([
        { date: new Date().toISOString() } as any
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
      mockPlantRepo.findOne.mockResolvedValue(mockPlant as any);
      
      // No recent watering
      mockCareRepo.findByPlantId.mockResolvedValue([]);
      
      // Recent fertilizer
      mockFertRepo.findByPlantId.mockResolvedValue([
        { date: new Date().toISOString() } as any
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
