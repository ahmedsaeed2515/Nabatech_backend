"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlantEmbeddingsService = void 0;
const genai_1 = require("@google/genai");
const plant_model_1 = __importDefault(require("../models/plant_model"));
const logger_1 = __importDefault(require("../logger"));
const ai = new genai_1.GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
class PlantEmbeddingsService {
    /**
     * Generates a text representation of the plant for embedding
     */
    static getPlantTextContent(plant) {
        return `
      Name: ${plant.nameEn} / ${plant.nameAr}
      Scientific Name: ${plant.scientificName}
      Category: ${plant.category}
      Care Level: ${plant.careLevel}
      Description: ${plant.descriptionEn}
      Watering: ${plant.waterRequirements} - ${plant.wateringFrequency}
      Lighting: ${plant.lightRequirements}
      Soil: ${plant.soilRequirements}
      Care Instructions: ${plant.careInstructions}
      Common Problems: ${plant.commonProblems}
    `;
    }
    /**
     * Generate and store embedding for a single plant
     */
    static async generateEmbeddingForPlant(plantId) {
        try {
            if (!process.env.GEMINI_API_KEY) {
                logger_1.default.warn("Skipping plant embedding generation: GEMINI_API_KEY not set");
                return;
            }
            const plant = await plant_model_1.default.findById(plantId);
            if (!plant)
                return;
            const text = this.getPlantTextContent(plant);
            const result = await ai.models.embedContent({
                model: "text-embedding-004",
                contents: text
            });
            const embedding = result.embeddings?.[0]?.values;
            if (!embedding) {
                throw new Error("No embedding values returned");
            }
            plant.embedding = embedding;
            await plant.save();
            logger_1.default.info({ event: "plant_embedding_generated_and_saved", plantId, dimensions: embedding.length });
        }
        catch (error) {
            logger_1.default.error({ event: "plant_embedding_failed", plantId, error: error.message });
        }
    }
    /**
     * Perform a semantic search query against the plant library
     */
    static async searchSimilarPlants(query, limit = 5) {
        try {
            if (!process.env.GEMINI_API_KEY)
                return [];
            const result = await ai.models.embedContent({
                model: "text-embedding-004",
                contents: query
            });
            const queryEmbedding = result.embeddings?.[0]?.values;
            if (!queryEmbedding)
                return [];
            const plants = await plant_model_1.default.aggregate([
                {
                    $vectorSearch: {
                        index: "vector_index", // Requires an Atlas Vector Search index named "vector_index"
                        path: "embedding",
                        queryVector: queryEmbedding,
                        numCandidates: limit * 10,
                        limit: limit
                    }
                },
                {
                    $match: {
                        isLibraryItem: true,
                        status: 'PUBLISHED'
                    }
                }
            ]);
            return plants;
        }
        catch (error) {
            logger_1.default.error({ event: "plant_embedding_search_failed", query, error: error.message });
            return [];
        }
    }
}
exports.PlantEmbeddingsService = PlantEmbeddingsService;
