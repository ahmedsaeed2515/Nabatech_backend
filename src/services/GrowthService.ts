import { GrowthMeasurementRepository } from '../repositories/GrowthMeasurementRepository';
import { PlantStageHistoryRepository } from '../repositories/PlantStageHistoryRepository';
import { PlantRepository } from '../repositories/PlantRepository';
import { PlantStage } from '../models/plant_model';
import mongoose from 'mongoose';

export class GrowthService {
  private growthRepo: GrowthMeasurementRepository;
  private stageHistoryRepo: PlantStageHistoryRepository;
  private plantRepo: PlantRepository;

  constructor() {
    this.growthRepo = new GrowthMeasurementRepository();
    this.stageHistoryRepo = new PlantStageHistoryRepository();
    this.plantRepo = new PlantRepository();
  }

  async logMeasurement(plantId: string, userId: string, data: { heightCm?: number; leafCount?: number; stage?: PlantStage; photoUrl?: string }) {
    const plant = await this.plantRepo.findOne({ _id: plantId, user: userId });
    if (!plant) throw new Error('Plant not found');

    const measurement = await this.growthRepo.create({
      user: new mongoose.Types.ObjectId(userId) as any,
      plant: new mongoose.Types.ObjectId(plantId) as any,
      heightCm: data.heightCm,
      leafCount: data.leafCount,
      stage: data.stage,
      photoUrl: data.photoUrl
    });

    if (data.stage && data.stage !== plant.stage) {
      // Stage has changed, create history and update plant
      await this.stageHistoryRepo.create({
        user: new mongoose.Types.ObjectId(userId) as any,
        plant: new mongoose.Types.ObjectId(plantId) as any,
        stage: data.stage,
        enteredAt: new Date()
      });

      plant.stage = data.stage;
      await plant.save();
    }

    return measurement;
  }

  async getTimeline(plantId: string, userId: string) {
    const measurements = await this.growthRepo.findByPlantId(plantId, userId);
    const stageHistory = await this.stageHistoryRepo.findByPlantId(plantId, userId);

    return {
      measurements,
      stageHistory
    };
  }
}


