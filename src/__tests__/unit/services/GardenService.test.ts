import { GardenService } from '../../../services/GardenService';
import { GardenRepository } from '../../../repositories/GardenRepository';
import { ZoneRepository } from '../../../repositories/ZoneRepository';
import { PlantRepository } from '../../../repositories/PlantRepository';
import { GardenType } from '../../../models/garden_model';
import { ZoneType } from '../../../models/zone_model';
import mongoose from 'mongoose';

jest.mock('../../../repositories/GardenRepository');
jest.mock('../../../repositories/ZoneRepository');
jest.mock('../../../repositories/PlantRepository');

describe('[UNIT] GardenService', () => {
  let gardenService: GardenService;
  let mockGardenRepo: jest.Mocked<GardenRepository>;
  let mockZoneRepo: jest.Mocked<ZoneRepository>;

  const userId = new mongoose.Types.ObjectId().toString();
  const gardenId = new mongoose.Types.ObjectId().toString();

  beforeEach(() => {
    jest.clearAllMocks();
    gardenService = new GardenService();
    mockGardenRepo = (gardenService as any).gardenRepo;
    mockZoneRepo = (gardenService as any).zoneRepo;
  });

  describe('createGarden', () => {
    it('يجب ينشئ حديقة ويرجع بياناتها', async () => {
      const mockGarden = { _id: gardenId, user: userId, name: 'My Garden', type: GardenType.OUTDOOR };
      mockGardenRepo.create.mockResolvedValue(mockGarden as any);

      const result = await gardenService.createGarden(userId, 'My Garden', GardenType.OUTDOOR);

      expect(mockGardenRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'My Garden',
        type: GardenType.OUTDOOR
      }));
      expect(result).toEqual(mockGarden);
    });
  });

  describe('getGardensByUser', () => {
    it('يجب يرجع قائمة حدائق المستخدم', async () => {
      const mockGardens = [{ _id: gardenId, name: 'My Garden' }];
      mockGardenRepo.findByUserId.mockResolvedValue(mockGardens as any);

      const result = await gardenService.getGardensByUser(userId);

      expect(mockGardenRepo.findByUserId).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockGardens);
    });
  });

  describe('createZone', () => {
    it('يجب ينشئ zone تابعة للحديقة', async () => {
      const mockZone = { _id: 'zone-123', garden: gardenId, name: 'Sunny Zone', type: ZoneType.FULL_SUN };
      mockZoneRepo.create.mockResolvedValue(mockZone as any);

      const result = await gardenService.createZone(gardenId, 'Sunny Zone', ZoneType.FULL_SUN);

      expect(mockZoneRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        name: 'Sunny Zone',
        type: ZoneType.FULL_SUN
      }));
      expect(result).toEqual(mockZone);
    });
  });

  describe('getZonesByGarden', () => {
    it('يجب يرجع الـ zones الخاصة بحديقة معينة', async () => {
      const mockZones = [{ _id: 'zone-1', name: 'Z1' }, { _id: 'zone-2', name: 'Z2' }];
      mockZoneRepo.findByGardenId.mockResolvedValue(mockZones as any);

      const result = await gardenService.getZonesByGarden(gardenId, userId);

      expect(mockZoneRepo.findByGardenId).toHaveBeenCalledWith(gardenId, userId);
      expect(result).toEqual(mockZones);
    });
  });
});


