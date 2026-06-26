import { Request, Response } from 'express';
import { PlantIdentificationService } from '../services/PlantIdentificationService';
import AiMemoryModel from '../models/ai_memory_model';
import mongoose from 'mongoose';

export class PlantIdentificationController {
  private idService: PlantIdentificationService;

  constructor() {
    this.idService = new PlantIdentificationService();
  }

  identifyPlant = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const imagePath = req.file?.path;

      if (!imagePath) {
        return res.status(400).json({ status: 'error', message: 'No image uploaded' });
      }

      const result = await this.idService.identifyImage(userId, imagePath);
      res.status(200).json({ status: 'success', data: result });
    } catch (err: any) {
      if (err.message === 'LOW_CONFIDENCE') {
        return res.status(400).json({ status: 'error', code: 'LOW_CONFIDENCE', message: 'We are not confident enough. Please take another photo.' });
      }
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  getHistory = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const history = await this.idService.getHistory(userId);
      res.status(200).json({ status: 'success', data: history });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  markAddedToGarden = async (req: Request, res: Response) => {
    try {
      const { id } = req.params; // identificationId
      const userId = (req as any).user._id || (req as any).user.userId;
      const { species } = req.body;

      const record = await this.idService.markAddedToGarden(id as string);
      if (!record) {
        return res.status(404).json({ status: 'error', message: 'Identification record not found' });
      }

      // Proactively push this context to the AI Agent Memory
      await AiMemoryModel.create({
        userId: userId.toString(),
        type: 'long_term',
        key: `garden_plant_${Date.now()}`,
        value: `User added a new plant: ${species || record.identifiedSpecies} on ${new Date().toISOString()}`
      });

      res.status(200).json({ status: 'success', message: 'Marked as added to garden and updated AI memory' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}


