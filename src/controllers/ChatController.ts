import { Request, Response } from 'express';
import { AiOrchestratorService } from '../services/AiOrchestratorService';
import { chatMessageSchema } from '../validation/v2';

export class ChatController {
  private aiOrchestrator: AiOrchestratorService;

  constructor() {
    this.aiOrchestrator = new AiOrchestratorService();
  }

  processChat = async (req: Request, res: Response) => {
    try {
      const parsed = chatMessageSchema.parse(req.body);
      const userId = (req as any).user._id || (req as any).user.userId;

      const aiResponse = await this.aiOrchestrator.processChat(userId, parsed.body.message);
      res.status(200).json({ status: 'success', data: aiResponse });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}


