"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantIdentificationService = void 0;
const genai_1 = require("@google/genai");
const PlantIdentificationRepository_1 = require("../repositories/PlantIdentificationRepository");
const plant_model_1 = __importDefault(require("../models/plant_model"));
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
const mongoose_1 = __importDefault(require("mongoose"));
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
class PlantIdentificationService {
    constructor() {
        this.idRepo = new PlantIdentificationRepository_1.PlantIdentificationRepository();
    }
    /**
     * Identifies a plant from an image file using Gemini Vision.
     */
    async identifyImage(userId, imagePath) {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error('GEMINI_API_KEY is not configured');
        }
        try {
            // Read image as base64
            const imageBuffer = fs_1.default.readFileSync(imagePath);
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
                        type: genai_1.Type.OBJECT,
                        properties: {
                            plantName: { type: genai_1.Type.STRING },
                            scientificName: { type: genai_1.Type.STRING },
                            confidenceScore: { type: genai_1.Type.NUMBER }
                        },
                        required: ['plantName', 'scientificName', 'confidenceScore']
                    }
                }
            });
            const rawText = response.text;
            if (!rawText)
                throw new Error('No response from AI');
            const parsedData = JSON.parse(rawText);
            if (parsedData.confidenceScore < 0.70) {
                throw new Error('LOW_CONFIDENCE');
            }
            // Log to history
            const historyRecord = await this.idRepo.create({
                user: new mongoose_1.default.Types.ObjectId(userId),
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
        }
        catch (error) {
            if (error.message === 'LOW_CONFIDENCE') {
                throw error;
            }
            logger_1.logger.error('Failed to identify plant: ' + error.message);
            throw new Error('Plant identification failed: ' + error.message);
        }
    }
    /**
     * Search PlantModel directly using fuzzy matching.
     */
    async matchWithLibrary(scientificName, plantName) {
        try {
            const query = {
                isLibraryItem: true,
                $or: [
                    { scientificName: { $regex: scientificName, $options: 'i' } },
                    { nameEn: { $regex: plantName, $options: 'i' } },
                    { normalizedNameEn: { $regex: plantName.toLowerCase(), $options: 'i' } }
                ]
            };
            const match = await plant_model_1.default.findOne(query).lean();
            return match || null;
        }
        catch (e) {
            logger_1.logger.warn('Failed to match identified plant with library: ' + e);
            return null;
        }
    }
    async getHistory(userId) {
        return this.idRepo.findByUserId(userId);
    }
    async markAddedToGarden(identificationId) {
        return this.idRepo.markAsAddedToGarden(identificationId);
    }
}
exports.PlantIdentificationService = PlantIdentificationService;
