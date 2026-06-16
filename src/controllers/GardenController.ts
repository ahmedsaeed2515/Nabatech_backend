import { Request, Response } from 'express';
import { GardenService } from '../services/GardenService';
import { createGardenSchema } from '../validation/v2';

export class GardenController {
  private gardenService: GardenService;

  constructor() {
    this.gardenService = new GardenService();
  }

  createGarden = async (req: Request, res: Response) => {
    try {
      const parsed = createGardenSchema.parse(req.body);
      // Assuming req.user is populated by an auth middleware
      const userId = (req as any).user._id || (req as any).user.userId;
      const garden = await this.gardenService.createGarden(userId, parsed.name, parsed.type);
      res.status(201).json({ status: 'success', data: garden });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  getGardens = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const gardens = await this.gardenService.getGardensByUser(userId);
      res.status(200).json({ status: 'success', data: gardens });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}
