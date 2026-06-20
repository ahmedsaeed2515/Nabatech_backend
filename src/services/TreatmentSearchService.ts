import { DiseaseKnowledgeRecord } from '../models/disease_knowledge_record_model';
import { env } from '../config/env';
import { GoogleGenAI } from '@google/genai';

export class TreatmentSearchService {
  public static async searchTreatments(query: string, limit: number = 3) {
    if (env.GEMINI_API_KEY) {
      const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
      try {
        const result = await ai.models.embedContent({
          model: "text-embedding-004",
          contents: query
        });
        const queryEmbedding = result.embeddings?.[0]?.values;

        if (queryEmbedding) {
          // If vector search index is defined, use it
          // Otherwise, we fallback to regex
          const results = await DiseaseKnowledgeRecord.aggregate([
            {
              $vectorSearch: {
                index: "disease_vector_index",
                path: "embedding",
                queryVector: queryEmbedding,
                numCandidates: limit * 10,
                limit: limit
              }
            }
          ]);
          if (results && results.length > 0) return results;
        }
      } catch (err) {
        // Fallback
      }
    }

    // Fallback to regex search
    return DiseaseKnowledgeRecord.find({
      $or: [
        { diseaseNameEn: { $regex: query, $options: "i" } },
        { diseaseNameAr: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } }
      ]
    }).limit(limit);
  }
}
