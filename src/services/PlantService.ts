import { PlantRepository } from '../repositories/PlantRepository';
import { Plant, PlantStage } from '../models/plant_model';
import mongoose from 'mongoose';

export class PlantService {
  private plantRepo: PlantRepository;

  constructor() {
    this.plantRepo = new PlantRepository();
  }

  async createPlant(userId: string, zoneId: string, dnaId: string, name: string, imageUrl?: string): Promise<Plant> {
    const dna = await mongoose.model('PlantDna').findById(dnaId);
    
    const plantData = {
      user: new mongoose.Types.ObjectId(userId) as any,
      zone: new mongoose.Types.ObjectId(zoneId) as any,
      dna: new mongoose.Types.ObjectId(dnaId) as any,
      name,
      scientificName: dna?.scientificName,
      imageUrl: imageUrl || '',
      lightRequirements: dna?.lightReq,
      wateringFrequency: dna?.waterFrequencyDays ? `Every ${dna.waterFrequencyDays} days` : undefined,
      stage: PlantStage.SEED,
      healthScore: 100
    };
    
    console.log("\n[DEBUG_RUNTIME] Plant object before save:", JSON.stringify(plantData, null, 2));
    
    const createdPlant = await this.plantRepo.create(plantData);
    console.log("\n[DEBUG_RUNTIME] Mongo document after save:", JSON.stringify(createdPlant.toObject(), null, 2));
    
    return createdPlant;
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

  async searchPlants(query: string, options: { limit: number }): Promise<Plant[]> {
    return this.plantRepo.searchPlants(query, options.limit);
  }

  async deletePlant(plantId: string, userId: string): Promise<boolean> {
    const plant = await this.plantRepo.findOne({ _id: plantId, user: userId });
    if (!plant) return false;
    await this.plantRepo.hardDelete(plantId);
    return true;
  }
}
