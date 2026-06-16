import { BaseRepository } from './BaseRepository';
import CareActionModel, { CareAction } from '../models/care_action_model';

export class CareActionRepository extends BaseRepository<CareAction> {
  constructor() {
    super(CareActionModel);
  }

  async findByPlantId(plantId: string, userId: string): Promise<CareAction[]> {
    return this.model.find({ plant: plantId }).where('user').equals(userId).sort({ date: -1 }).exec();
  }

  async findRecentWatering(plantId: string): Promise<CareAction | null> {
    return this.model.findOne({ plant: plantId, type: 'WATER' }).sort({ date: -1 }).exec();
  }

  async aggregateCareActions(pipeline: any[]): Promise<any[]> {
    return this.model.aggregate(pipeline).exec();
  }
}
