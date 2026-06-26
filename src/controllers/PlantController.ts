import { Request, Response } from 'express';
import { PlantService } from '../services/PlantService';
import { createPlantSchema } from '../validation/v2';
import { z } from 'zod';

const updatePlantSchema = z.object({
  name: z.string().optional(),
  imageUrl: z.string().optional()
});

export class PlantController {
  private plantService: PlantService;

  constructor() {
    this.plantService = new PlantService();
  }

  createPlant = async (req: Request, res: Response) => {
    try {
      const parsed = createPlantSchema.parse(req.body);
      const userId = (req as any).user._id || (req as any).user.userId;
      const plant = await this.plantService.createPlant(userId, parsed.zoneId, parsed.dnaId, parsed.name);
      res.status(201).json({ status: 'success', data: plant });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  getPlantDetails = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user._id || (req as any).user.userId;
      const plant = await this.plantService.getPlantDetails(id, userId);
      if (!plant) {
        return res.status(404).json({ status: 'error', message: 'Plant not found' });
      }
      res.status(200).json({ status: 'success', data: plant });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  updatePlant = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const parsed = updatePlantSchema.parse(req.body);
      const userId = (req as any).user._id || (req as any).user.userId;
      
      const plant = await this.plantService.getPlantDetails(id, userId);
      if (!plant) {
        return res.status(404).json({ status: 'error', message: 'Plant not found' });
      }

      if (parsed.name) plant.name = parsed.name;
      if (parsed.imageUrl) plant.imageUrl = parsed.imageUrl;
      
      await plant.save();
      res.status(200).json({ status: 'success', data: plant });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  deletePlant = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const userId = (req as any).user._id || (req as any).user.userId;
      const success = await this.plantService.deletePlant(id, userId);
      if (!success) {
        return res.status(404).json({ status: 'error', message: 'Plant not found or unauthorized' });
      }
      res.status(200).json({ status: 'success', message: 'Plant deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}


