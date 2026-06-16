import { Request, Response } from 'express';
import { GardenService } from '../services/GardenService';
import { createZoneSchema } from '../validation/v2';
import { ZoneRepository } from '../repositories/ZoneRepository';

export class ZoneController {
  private gardenService: GardenService;
  private zoneRepo: ZoneRepository;

  constructor() {
    this.gardenService = new GardenService();
    this.zoneRepo = new ZoneRepository();
  }

  createZone = async (req: Request, res: Response) => {
    try {
      const parsed = createZoneSchema.parse(req.body);
      const gardenId = req.body.gardenId; // or get from params if routes are nested
      
      if (!gardenId) {
        return res.status(400).json({ status: 'error', message: 'gardenId is required' });
      }

      const zone = await this.gardenService.createZone(gardenId, parsed.name, parsed.type);
      res.status(201).json({ status: 'success', data: zone });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  getZones = async (req: Request, res: Response) => {
    try {
      const { gardenId } = req.query;
      const userId = (req as any).user._id || (req as any).user.userId;
      
      if (!gardenId) {
        return res.status(400).json({ status: 'error', message: 'gardenId query parameter is required' });
      }

      const zones = await this.gardenService.getZonesByGarden(gardenId as string, userId);
      res.status(200).json({ status: 'success', data: zones });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}
