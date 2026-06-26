import { BaseRepository } from './BaseRepository';
import PlantHealthLogModel, { PlantHealthLog } from '../models/plant_health_log_model';

export class PlantHealthLogRepository extends BaseRepository<PlantHealthLog> {
  constructor() {
    super(PlantHealthLogModel);
  }
}


