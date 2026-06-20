"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const GardenService_1 = require("../../../services/GardenService");
const garden_model_1 = require("../../../models/garden_model");
const zone_model_1 = require("../../../models/zone_model");
const mongoose_1 = __importDefault(require("mongoose"));
jest.mock('../../../repositories/GardenRepository');
jest.mock('../../../repositories/ZoneRepository');
jest.mock('../../../repositories/PlantRepository');
describe('[UNIT] GardenService', () => {
    let gardenService;
    let mockGardenRepo;
    let mockZoneRepo;
    const userId = new mongoose_1.default.Types.ObjectId().toString();
    const gardenId = new mongoose_1.default.Types.ObjectId().toString();
    beforeEach(() => {
        jest.clearAllMocks();
        gardenService = new GardenService_1.GardenService();
        mockGardenRepo = gardenService.gardenRepo;
        mockZoneRepo = gardenService.zoneRepo;
    });
    describe('createGarden', () => {
        it('يجب ينشئ حديقة ويرجع بياناتها', async () => {
            const mockGarden = { _id: gardenId, user: userId, name: 'My Garden', type: garden_model_1.GardenType.OUTDOOR };
            mockGardenRepo.create.mockResolvedValue(mockGarden);
            const result = await gardenService.createGarden(userId, 'My Garden', garden_model_1.GardenType.OUTDOOR);
            expect(mockGardenRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'My Garden',
                type: garden_model_1.GardenType.OUTDOOR
            }));
            expect(result).toEqual(mockGarden);
        });
    });
    describe('getGardensByUser', () => {
        it('يجب يرجع قائمة حدائق المستخدم', async () => {
            const mockGardens = [{ _id: gardenId, name: 'My Garden' }];
            mockGardenRepo.findByUserId.mockResolvedValue(mockGardens);
            const result = await gardenService.getGardensByUser(userId);
            expect(mockGardenRepo.findByUserId).toHaveBeenCalledWith(userId);
            expect(result).toEqual(mockGardens);
        });
    });
    describe('createZone', () => {
        it('يجب ينشئ zone تابعة للحديقة', async () => {
            const mockZone = { _id: 'zone-123', garden: gardenId, name: 'Sunny Zone', type: zone_model_1.ZoneType.FULL_SUN };
            mockZoneRepo.create.mockResolvedValue(mockZone);
            const result = await gardenService.createZone(gardenId, 'Sunny Zone', zone_model_1.ZoneType.FULL_SUN);
            expect(mockZoneRepo.create).toHaveBeenCalledWith(expect.objectContaining({
                name: 'Sunny Zone',
                type: zone_model_1.ZoneType.FULL_SUN
            }));
            expect(result).toEqual(mockZone);
        });
    });
    describe('getZonesByGarden', () => {
        it('يجب يرجع الـ zones الخاصة بحديقة معينة', async () => {
            const mockZones = [{ _id: 'zone-1', name: 'Z1' }, { _id: 'zone-2', name: 'Z2' }];
            mockZoneRepo.findByGardenId.mockResolvedValue(mockZones);
            const result = await gardenService.getZonesByGarden(gardenId, userId);
            expect(mockZoneRepo.findByGardenId).toHaveBeenCalledWith(gardenId, userId);
            expect(result).toEqual(mockZones);
        });
    });
});
