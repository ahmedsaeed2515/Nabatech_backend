import { Request, Response } from 'express';
import { GrowthService } from '../services/GrowthService';
import { growthMeasurementSchema } from '../validation/v2';
import cloudinary from '../config/cloudinary';

export class GrowthController {
  private growthService: GrowthService;

  constructor() {
    this.growthService = new GrowthService();
  }

  logMeasurement = async (req: Request, res: Response) => {
    try {
      const { id: rawId } = req.params;
const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const userId = (req as any).user._id || (req as any).user.userId;
      
      const parsed = growthMeasurementSchema.parse(req.body);
      
      let photoUrl: string | undefined = undefined;

      if (req.file) {
        // Upload buffer to cloudinary
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'nabatech/growth',
        });
        photoUrl = result.secure_url;
      }

      const measurement = await this.growthService.logMeasurement(id, userId, {
        heightCm: parsed.heightCm,
        leafCount: parsed.leafCount,
        stage: parsed.stage as any,
        photoUrl
      });

      res.status(201).json({ status: 'success', data: measurement });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  getTimeline = async (req: Request, res: Response) => {
    try {
      const { id: rawId } = req.params;
const id = Array.isArray(rawId) ? rawId[0] : rawId;
      const userId = (req as any).user._id || (req as any).user.userId;
      
      const timeline = await this.growthService.getTimeline(id, userId);
      res.status(200).json({ status: 'success', data: timeline });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}


