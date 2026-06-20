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

  updateGarden = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user._id || (req as any).user.userId;
      const data = req.body;
      const garden = await this.gardenService.updateGarden(id, userId, data);
      if (!garden) {
        return res.status(404).json({ status: 'error', message: 'Garden not found or unauthorized' });
      }
      res.status(200).json({ status: 'success', data: garden });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  deleteGarden = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user._id || (req as any).user.userId;
      const success = await this.gardenService.deleteGarden(id, userId);
      if (!success) {
        return res.status(404).json({ status: 'error', message: 'Garden not found or unauthorized' });
      }
      res.status(200).json({ status: 'success', message: 'Garden deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}
