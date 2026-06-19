import { PlantHealthLogRepository } from '../repositories/PlantHealthLogRepository';
import { CareActionRepository } from '../repositories/CareActionRepository';
import { FertilizerLogRepository } from '../repositories/FertilizerLogRepository';
import { PlantRepository } from '../repositories/PlantRepository';
import { CareActionType } from '../models/care_action_model';
import mongoose from 'mongoose';

export class HealthEngineService {
  private healthRepo: PlantHealthLogRepository;
  private careRepo: CareActionRepository;
  private fertRepo: FertilizerLogRepository;
  private plantRepo: PlantRepository;

  constructor() {
    this.healthRepo = new PlantHealthLogRepository();
    this.careRepo = new CareActionRepository();
    this.fertRepo = new FertilizerLogRepository();
    this.plantRepo = new PlantRepository();
  }

  async calculate(plantId: string, userId: string): Promise<number> {
    const plant = await this.plantRepo.findOne({ _id: plantId, user: userId });
    if (!plant) throw new Error('Plant not found');

    let score = 100;
    const issues: string[] = [];

    // Check overdue watering
    const careActions = await this.careRepo.findByPlantId(plantId, userId);
    const lastWatering = careActions.find(a => a.type === CareActionType.WATER);

    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const now = new Date().getTime();

    if (!lastWatering || !lastWatering.date || (now - new Date(lastWatering.date).getTime() > SEVEN_DAYS_MS)) {
      score -= 10;
      issues.push('Overdue watering');
    }

    // Check recent fertilizer
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const fertLogs = await this.fertRepo.findByPlantId(plantId, userId);
    const recentFert = fertLogs.find(f => f.date && (now - new Date(f.date).getTime() <= THIRTY_DAYS_MS));

    if (recentFert) {
      score = Math.min(100, score + 5);
    }

    // Save PlantHealthLog
    await this.healthRepo.create({
      user: new mongoose.Types.ObjectId(userId) as any,
      plant: new mongoose.Types.ObjectId(plantId) as any,
      score,
      issues
    });

    // Update Plant
    plant.healthScore = score;
    await plant.save();

    return score;
  }
}
