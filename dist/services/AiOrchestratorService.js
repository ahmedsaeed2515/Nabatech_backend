"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiOrchestratorService = void 0;
const genai_1 = require("@google/genai");
const PlantRepository_1 = require("../repositories/PlantRepository");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
class AiOrchestratorService {
    constructor() {
        this.ai = new genai_1.GoogleGenAI({ apiKey: env_1.env.GEMINI_API_KEY });
        this.plantRepo = new PlantRepository_1.PlantRepository();
    }
    async processChat(userId, message) {
        const plants = await this.plantRepo.findByUserId(userId);
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
                        type: genai_1.Type.OBJECT,
                        properties: {
                            reply: { type: genai_1.Type.STRING },
                            detectedPlant: {
                                type: genai_1.Type.OBJECT,
                                nullable: true,
                                properties: {
                                    name: { type: genai_1.Type.STRING },
                                    species: { type: genai_1.Type.STRING }
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
        }
        catch (err) {
            logger_1.logger.error('Error generating AI response:', err);
            throw new Error('Failed to generate AI response');
        }
    }
    async analyzeGarden(userId) {
        const plants = await this.plantRepo.findByUserId(userId);
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
                        type: genai_1.Type.OBJECT,
                        properties: {
                            score: { type: genai_1.Type.INTEGER, description: 'Overall garden score from 0 to 100' },
                            urgentActions: {
                                type: genai_1.Type.ARRAY,
                                items: { type: genai_1.Type.STRING },
                                description: 'List of urgent actions needed (e.g. "Water the Ficus")'
                            },
                            summary: { type: genai_1.Type.STRING, description: 'A short summary of the garden health' }
                        },
                        required: ['score', 'urgentActions', 'summary']
                    }
                }
            });
            if (!response.text) {
                throw new Error('No response from AI');
            }
            return JSON.parse(response.text);
        }
        catch (err) {
            logger_1.logger.error('Error generating garden analysis:', err);
            throw new Error('Failed to analyze garden');
        }
    }
}
exports.AiOrchestratorService = AiOrchestratorService;
