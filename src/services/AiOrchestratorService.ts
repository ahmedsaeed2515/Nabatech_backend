import { GoogleGenAI, Type } from '@google/genai';
import { PlantRepository } from '../repositories/PlantRepository';
import MyPlant from '../models/my_plant_model';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export class AiOrchestratorService {
  private ai: GoogleGenAI;
  private plantRepo: PlantRepository;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    this.plantRepo = new PlantRepository();
  }

  private async getMergedUserPlants(userId: string) {
    // Fetch only V2 plants from PlantRepository
    const plants = await this.plantRepo.findByUserId(userId);
    return plants.map(p => ({
      id: p._id.toString(),
      name: p.name,
      species: p.scientificName || 'Unknown',
      stage: p.stage,
      healthScore: p.healthScore,
      lastWatered: p.lastWatered,
    }));
  }

  async processChat(userId: string, message: string) {
    const plants = await this.getMergedUserPlants(userId);
    const minifiedPlants = plants.map(p => ({
      name: p.name,
      stage: p.stage,
      healthScore: p.healthScore
    }));
    
    const contextStr = JSON.stringify(minifiedPlants);
    const systemInstruction = `You are Nabatech AI. User's plants: ${contextStr}. Answer questions using this context.`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: message,
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reply: { type: Type.STRING },
              detectedPlant: {
                type: Type.OBJECT,
                nullable: true,
                properties: {
                  name: { type: Type.STRING },
                  species: { type: Type.STRING }
                }
              }
            },
            required: ['reply']
          }
        }
      });

      if (!response.text) {
        throw new Error('No response from AI');
      }

      return JSON.parse(response.text);
    } catch (err) {
      logger.error('Error generating AI response:', err);
      throw new Error('Failed to generate AI response');
    }
  }

  async analyzeGarden(userId: string) {
    const plants = await this.getMergedUserPlants(userId);
    const minifiedPlants = plants.map(p => ({
      name: p.name,
      stage: p.stage,
      healthScore: p.healthScore,
      lastWatered: p.lastWatered
    }));

    const contextStr = JSON.stringify(minifiedPlants);
    const systemInstruction = `You are Nabatech AI Garden Manager. Analyze the user's garden and provide a report. Here are the plants: ${contextStr}`;

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Generate a garden report.',
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              score: { type: Type.INTEGER, description: 'Overall garden score from 0 to 100' },
              urgentActions: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING },
                description: 'List of urgent actions needed (e.g. "Water the Ficus")'
              },
              summary: { type: Type.STRING, description: 'A short summary of the garden health' }
            },
            required: ['score', 'urgentActions', 'summary']
          }
        }
      });

      if (!response.text) {
        throw new Error('No response from AI');
      }

      return JSON.parse(response.text);
    } catch (err) {
      logger.error('Error generating garden analysis:', err);
      throw new Error('Failed to analyze garden');
    }
  }
}
