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

  updateZone = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const data = req.body;
      const zone = await this.gardenService.updateZone(id, data);
      if (!zone) {
        return res.status(404).json({ status: 'error', message: 'Zone not found' });
      }
      res.status(200).json({ status: 'success', data: zone });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  deleteZone = async (req: Request, res: Response) => {
    try {
      const id = req.params.id as string;
      const success = await this.gardenService.deleteZone(id);
      if (!success) {
        return res.status(404).json({ status: 'error', message: 'Zone not found' });
      }
      res.status(200).json({ status: 'success', message: 'Zone deleted successfully' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}


