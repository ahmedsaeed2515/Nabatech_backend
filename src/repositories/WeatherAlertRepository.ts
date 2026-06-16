import { BaseRepository } from './BaseRepository';
import WeatherAlertModel, { WeatherAlert } from '../models/weather_alert_model';

export class WeatherAlertRepository extends BaseRepository<WeatherAlert> {
  constructor() {
    super(WeatherAlertModel);
  }

  async findByUserId(userId: string): Promise<WeatherAlert[]> {
    return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }

  async checkRecentAlert(userId: string, zoneId: string, severity: string, since: Date): Promise<boolean> {
    const alerts = await this.model.find({
      user: userId,
      zone: zoneId,
      severity,
      createdAt: { $gte: since }
    }).exec();
    return alerts.length > 0;
  }
}
