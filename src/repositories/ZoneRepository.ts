import ZoneModel, { Zone } from '../models/zone_model';
import { BaseRepository } from './BaseRepository';

export class ZoneRepository extends BaseRepository<Zone> {
  constructor() {
    super(ZoneModel);
  }

  async findByGardenId(gardenId: string, userId: string): Promise<Zone[]> {
    return this.model.find({ garden: gardenId }).where('user').equals(userId).exec();
  }

  async findOutdoorZonesWithUsers(): Promise<Zone[]> {
    return this.model.find({ type: 'OUTDOOR' }).populate('user').exec();
  }
}


