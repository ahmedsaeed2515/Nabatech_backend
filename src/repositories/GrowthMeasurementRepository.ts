import { BaseRepository } from './BaseRepository';
import GrowthMeasurementModel, { GrowthMeasurement } from '../models/growth_measurement_model';

export class GrowthMeasurementRepository extends BaseRepository<GrowthMeasurement> {
  constructor() {
    super(GrowthMeasurementModel);
  }

  async findByPlantId(plantId: string, userId: string): Promise<GrowthMeasurement[]> {
    return this.model.find({ plant: plantId }).where('user').equals(userId).sort({ createdAt: -1 }).exec();
  }
}


