import { Request, Response } from 'express';
import { VoiceService } from '../services/VoiceService';
import { MediaService } from '../services/MediaService';

export class EdgeController {
  private voiceService: VoiceService;
  private mediaService: MediaService;

  constructor() {
    this.voiceService = new VoiceService();
    this.mediaService = new MediaService();
  }

  processVoiceCommand = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      
      // Assume audio file is uploaded via multer
      if (!req.file) {
        res.status(400).json({ status: 'error', message: 'No audio file provided' });
        return;
      }

      const audioFilePath = req.file.path;
      const result = await this.voiceService.processAudio(userId, audioFilePath);
      res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  };

  requestTimelapse = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const { plantId } = req.body;

      if (!plantId) {
        res.status(400).json({ status: 'error', message: 'plantId is required' });
        return;
      }

      const job = await this.mediaService.requestTimelapse(userId, plantId);
      res.status(202).json({ status: 'success', data: job, message: 'Timelapse generation queued' });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  };

  getTimelapseJobs = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const jobs = await this.mediaService.getTimelapseJobs(userId);
      res.status(200).json({ status: 'success', data: jobs });
    } catch (err: any) {
      res.status(500).json({ status: 'error', message: err.message });
    }
  };
}


