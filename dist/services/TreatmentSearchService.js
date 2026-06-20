"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TreatmentSearchService = void 0;
const disease_knowledge_record_model_1 = require("../models/disease_knowledge_record_model");
const env_1 = require("../config/env");
const genai_1 = require("@google/genai");
class TreatmentSearchService {
    static async searchTreatments(query, limit = 3) {
        if (env_1.env.GEMINI_API_KEY) {
            const ai = new genai_1.GoogleGenAI({ apiKey: env_1.env.GEMINI_API_KEY });
            try {
                const result = await ai.models.embedContent({
                    model: "text-embedding-004",
                    contents: query
                });
                const queryEmbedding = result.embeddings?.[0]?.values;
                if (queryEmbedding) {
                    // If vector search index is defined, use it
                    // Otherwise, we fallback to regex
                    const results = await disease_knowledge_record_model_1.DiseaseKnowledgeRecord.aggregate([
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
                    if (results && results.length > 0)
                        return results;
                }
            }
            catch (err) {
                // Fallback
            }
        }
        // Fallback to regex search
        return disease_knowledge_record_model_1.DiseaseKnowledgeRecord.find({
            $or: [
                { diseaseNameEn: { $regex: query, $options: "i" } },
                { diseaseNameAr: { $regex: query, $options: "i" } },
                { tags: { $regex: query, $options: "i" } }
            ]
        }).limit(limit);
    }
}
exports.TreatmentSearchService = TreatmentSearchService;
