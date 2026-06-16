import { GardenRepository } from '../repositories/GardenRepository';
import { ZoneRepository } from '../repositories/ZoneRepository';
import { PlantRepository } from '../repositories/PlantRepository';
import { Garden, GardenType } from '../models/garden_model';
import { Zone, ZoneType } from '../models/zone_model';
import { Plant, PlantStage } from '../models/plant_model';
import mongoose from 'mongoose';

export class GardenService {
  private gardenRepo: GardenRepository;
  private zoneRepo: ZoneRepository;
  private plantRepo: PlantRepository;

  constructor() {
    this.gardenRepo = new GardenRepository();
    this.zoneRepo = new ZoneRepository();
    this.plantRepo = new PlantRepository();
  }

  async createGarden(userId: string, name: string, type: GardenType): Promise<Garden> {
    return this.gardenRepo.create({ user: new mongoose.Types.ObjectId(userId) as any, name, type });
  }

  async getGardensByUser(userId: string): Promise<Garden[]> {
    return this.gardenRepo.findByUserId(userId);
  }

  async createZone(gardenId: string, name: string, type: ZoneType): Promise<Zone> {
    return this.zoneRepo.create({ garden: new mongoose.Types.ObjectId(gardenId) as any, name, type });
  }

  async getZonesByGarden(gardenId: string, userId: string): Promise<Zone[]> {
    return this.zoneRepo.findByGardenId(gardenId, userId);
  }
}
