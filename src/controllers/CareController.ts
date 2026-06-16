import { Request, Response } from 'express';
import { CareService } from '../services/CareService';
import { careActionSchema, fertilizerSchema } from '../validation/v2';

export class CareController {
  private careService: CareService;

  constructor() {
    this.careService = new CareService();
  }

  logCareAction = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const parsed = careActionSchema.parse(req.body);
      const userId = (req as any).user._id || (req as any).user.userId;
      const date = parsed.date ? new Date(parsed.date) : new Date();

      const action = await this.careService.logAction(id, userId, parsed.type as any, date, parsed.notes);
      
      res.status(201).json({ status: 'success', data: action, message: 'Care action logged and queued for health sync' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  logFertilizer = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const parsed = fertilizerSchema.parse(req.body);
      const userId = (req as any).user._id || (req as any).user.userId;
      const date = parsed.date ? new Date(parsed.date) : new Date();

      const fertLog = await this.careService.logFertilizer(id, userId, parsed.type as any, parsed.amount, date);
      
      res.status(201).json({ status: 'success', data: fertLog, message: 'Fertilizer logged and queued for health sync' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}
