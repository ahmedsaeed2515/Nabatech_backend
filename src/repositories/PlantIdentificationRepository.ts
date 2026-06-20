import PlantIdentificationHistoryModel, { IPlantIdentificationHistory } from '../models/plant_identification_history_model';
import { BaseRepository } from './BaseRepository';
import mongoose from 'mongoose';

export class PlantIdentificationRepository extends BaseRepository<IPlantIdentificationHistory> {
  constructor() {
    super(PlantIdentificationHistoryModel);
  }

  async findByUserId(userId: string): Promise<IPlantIdentificationHistory[]> {
    return this.model.find({ user: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
  }

  async markAsAddedToGarden(id: string): Promise<IPlantIdentificationHistory | null> {
    return this.model.findByIdAndUpdate(id, { isAddedToGarden: true }, { new: true });
  }
}
