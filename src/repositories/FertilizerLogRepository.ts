import { BaseRepository } from './BaseRepository';
import FertilizerLogModel, { FertilizerLog } from '../models/fertilizer_log_model';

export class FertilizerLogRepository extends BaseRepository<FertilizerLog> {
  constructor() {
    super(FertilizerLogModel);
  }

  async findByPlantId(plantId: string, userId: string): Promise<FertilizerLog[]> {
    return this.model.find({ plant: plantId }).where('user').equals(userId).sort({ date: -1 }).exec();
  }
}


