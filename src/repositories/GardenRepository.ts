import GardenModel, { Garden } from '../models/garden_model';
import { BaseRepository } from './BaseRepository';

export class GardenRepository extends BaseRepository<Garden> {
  constructor() {
    super(GardenModel);
  }

  async findByUserId(userId: string): Promise<Garden[]> {
    return this.model.find().where('user').equals(userId).exec();
  }
}


