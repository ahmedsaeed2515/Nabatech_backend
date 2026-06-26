import { BaseRepository } from './BaseRepository';
import CalendarEventModel, { CalendarEvent } from '../models/calendar_event_model';

export class CalendarEventRepository extends BaseRepository<CalendarEvent> {
  constructor() {
    super(CalendarEventModel);
  }

  async findByDate(userId: string, dateStart: Date, dateEnd: Date): Promise<CalendarEvent | null> {
    return this.model.findOne({
      date: { $gte: dateStart, $lt: dateEnd }
    }).where('user').equals(userId).populate('tasks').exec();
  }
}


