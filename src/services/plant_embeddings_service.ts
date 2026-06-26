import { GoogleGenAI } from "@google/genai";
import Plant from "../models/plant_model";
import logger from "../logger";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

export class PlantEmbeddingsService {
  /**
   * Generates a text representation of the plant for embedding
   */
  private static getPlantTextContent(plant: any): string {
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
  public static async generateEmbeddingForPlant(plantId: string): Promise<void> {
    try {
      if (!process.env.GEMINI_API_KEY) {
        logger.warn("Skipping plant embedding generation: GEMINI_API_KEY not set");
        return;
      }
      const plant = await Plant.findById(plantId);
      if (!plant) return;

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

      logger.info({ event: "plant_embedding_generated_and_saved", plantId, dimensions: embedding.length });
      
    } catch (error: any) {
      logger.error({ event: "plant_embedding_failed", plantId, error: error.message });
    }
  }

  /**
   * Perform a semantic search query against the plant library
   */
  public static async searchSimilarPlants(query: string, limit: number = 5): Promise<any[]> {
    try {
      if (!process.env.GEMINI_API_KEY) return [];
      
      const result = await ai.models.embedContent({
        model: "text-embedding-004",
        contents: query
      });
      const queryEmbedding = result.embeddings?.[0]?.values;

      if (!queryEmbedding) return [];

      const plants = await Plant.aggregate([
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
    } catch (error: any) {
      logger.error({ event: "plant_embedding_search_failed", query, error: error.message });
      return [];
    }
  }
}


