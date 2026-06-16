import { BaseRepository } from './BaseRepository';
import PlantStageHistoryModel, { PlantStageHistory } from '../models/plant_stage_history_model';

export class PlantStageHistoryRepository extends BaseRepository<PlantStageHistory> {
  constructor() {
    super(PlantStageHistoryModel);
  }

  async findByPlantId(plantId: string, userId: string): Promise<PlantStageHistory[]> {
    return this.model.find({ plant: plantId }).where('user').equals(userId).sort({ enteredAt: -1 }).exec();
  }
}
