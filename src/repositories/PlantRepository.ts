import PlantModel, { Plant } from '../models/plant_model';
import { BaseRepository } from './BaseRepository';

export class PlantRepository extends BaseRepository<Plant> {
  constructor() {
    super(PlantModel);
  }

  async findByZoneId(zoneId: string, userId: string): Promise<Plant[]> {
    return this.model.find({ zone: zoneId }).where('user').equals(userId).exec();
  }

  async findByUserId(userId: string): Promise<Plant[]> {
    return this.model.find().where('user').equals(userId).exec();
  }

  async findAllWithDna(): Promise<Plant[]> {
    return this.model.find().populate('dna').exec();
  }

  async searchPlants(query: string, limit: number): Promise<Plant[]> {
    return this.model.find({ name: { $regex: query, $options: 'i' } }).limit(limit).exec();
  }
}
