import { CareActionRepository } from '../repositories/CareActionRepository';
import { FertilizerLogRepository } from '../repositories/FertilizerLogRepository';
import { CareActionType } from '../models/care_action_model';
import { FertilizerType } from '../models/fertilizer_log_model';
import { careSyncQueue } from '../queues/care_queue';
import mongoose from 'mongoose';

export class CareService {
  private careRepo: CareActionRepository;
  private fertRepo: FertilizerLogRepository;

  constructor() {
    this.careRepo = new CareActionRepository();
    this.fertRepo = new FertilizerLogRepository();
  }

  async logAction(plantId: string, userId: string, type: CareActionType, date: Date, notes?: string) {
    const action = await this.careRepo.create({
      user: new mongoose.Types.ObjectId(userId) as any,
      plant: new mongoose.Types.ObjectId(plantId) as any,
      type,
      date,
      notes
    });

    await careSyncQueue?.add('care.sync.action', { plantId, userId });

    return action;
  }

  async logFertilizer(plantId: string, userId: string, type: FertilizerType, amount: string, date: Date) {
    const fertLog = await this.fertRepo.create({
      user: new mongoose.Types.ObjectId(userId) as any,
      plant: new mongoose.Types.ObjectId(plantId) as any,
      type,
      amount,
      date
    });

    await careSyncQueue?.add('care.sync.fertilizer', { plantId, userId });

    return fertLog;
  }
}
