// FIX [TASK-7.2]: Expose VoiceService via HTTP route
import { Request, Response } from 'express';
import { VoiceService } from '../services/VoiceService';

export class VoiceController {
  static async processVoiceCommand(req: Request, res: Response) {
    try {
      const userId = (req as any).user._id.toString();
      const { audioBase64, language } = req.body;

      if (!audioBase64) {
        res.status(400).json({ success: false, message: 'audioBase64 is required' });
        return;
      }

      const voiceService = new VoiceService();
      const result = await voiceService.processCommand(audioBase64, userId, language || 'ar');
      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
}
