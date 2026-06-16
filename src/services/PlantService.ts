import { PlantRepository } from '../repositories/PlantRepository';
import { Plant, PlantStage } from '../models/plant_model';
import mongoose from 'mongoose';

export class PlantService {
  private plantRepo: PlantRepository;

  constructor() {
    this.plantRepo = new PlantRepository();
  }

  async createPlant(userId: string, zoneId: string, dnaId: string, name: string): Promise<Plant> {
    return this.plantRepo.create({
      user: new mongoose.Types.ObjectId(userId) as any,
      zone: new mongoose.Types.ObjectId(zoneId) as any,
      dna: new mongoose.Types.ObjectId(dnaId) as any,
      name,
      stage: PlantStage.SEED,
      healthScore: 100
    });
  }

  async getPlantDetails(plantId: string, userId: string): Promise<Plant | null> {
    return this.plantRepo.findOne({ _id: plantId, user: userId });
  }

  async getPlantsByUser(userId: string): Promise<Plant[]> {
    return this.plantRepo.findByUserId(userId);
  }

  async getPlantsByZone(zoneId: string, userId: string): Promise<Plant[]> {
    return this.plantRepo.findByZoneId(zoneId, userId);
  }
}
