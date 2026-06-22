import { GoogleGenAI, Type } from '@google/genai';
import { PlantIdentificationRepository } from '../repositories/PlantIdentificationRepository';
import { PlantEmbeddingsService } from './plant_embeddings_service';
import Plant from '../models/plant_model';
import { logger } from '../utils/logger';
import fs from 'fs';
import mongoose from 'mongoose';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export class PlantIdentificationService {
  private idRepo: PlantIdentificationRepository;

  constructor() {
    this.idRepo = new PlantIdentificationRepository();
  }

  /**
   * Identifies a plant from an image file using Gemini Vision.
   */
  async identifyImage(userId: string, imagePath: string) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    try {
      // Read image as base64
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Data = imageBuffer.toString('base64');
      const mimeType = imagePath.endsWith('.png') ? 'image/png' : 'image/jpeg';

      const prompt = `
        You are an expert botanist and horticulturist. Analyze this image and identify the plant species.
        Return ONLY a JSON object with the following schema, and no other text:
        {
          "plantName": "Common Name",
          "scientificName": "Scientific Name",
          "confidenceScore": 0.95 // between 0.0 and 1.0
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          {
            inlineData: {
              data: base64Data,
              mimeType
            }
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              plantName: { type: Type.STRING },
              scientificName: { type: Type.STRING },
              confidenceScore: { type: Type.NUMBER }
            },
            required: ['plantName', 'scientificName', 'confidenceScore']
          }
        }
      });

      const rawText = response.text;
      if (!rawText) throw new Error('No response from AI');

      const parsedData = JSON.parse(rawText);
      
      if (parsedData.confidenceScore < 0.70) {
        throw new Error('LOW_CONFIDENCE');
      }

      // Log to history
      const historyRecord = await this.idRepo.create({
        user: new mongoose.Types.ObjectId(userId) as any,
        imageUrl: imagePath,
        identifiedSpecies: parsedData.scientificName,
        confidenceScore: parsedData.confidenceScore,
        rawResponse: parsedData
      });

      // Semantic Search for Library Match
      const libraryMatch = await this.matchWithLibrary(parsedData.scientificName, parsedData.plantName);

      return {
        identificationId: historyRecord._id,
        plantName: parsedData.plantName,
        scientificName: parsedData.scientificName,
        confidenceScore: parsedData.confidenceScore,
        libraryMatch
      };

    } catch (error: any) {
      if (error.message === 'LOW_CONFIDENCE') {
        throw error;
      }
      logger.error('Failed to identify plant: ' + error.message);
      throw new Error('Plant identification failed: ' + error.message);
    }
  }

  /**
   * Search PlantModel directly using fuzzy matching.
   */
  async matchWithLibrary(scientificName: string, plantName: string) {
    try {
      const query = {
        isLibraryItem: true,
        $or: [
          { scientificName: { $regex: scientificName, $options: 'i' } },
          { nameEn: { $regex: plantName, $options: 'i' } },
          { normalizedNameEn: { $regex: plantName.toLowerCase(), $options: 'i' } }
        ]
      };
      
      const match = await Plant.findOne(query).lean();
      return match || null;
    } catch (e) {
      logger.warn('Failed to match identified plant with library: ' + e);
      return null;
    }
  }

  async getHistory(userId: string) {
    return this.idRepo.findByUserId(userId);
  }

  async markAddedToGarden(identificationId: string) {
    return this.idRepo.markAsAddedToGarden(identificationId);
  }
}
