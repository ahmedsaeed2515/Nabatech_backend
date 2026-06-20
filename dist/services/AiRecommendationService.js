"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRecommendationService = void 0;
const genai_1 = require("@google/genai");
const env_1 = require("../config/env");
const plant_model_1 = __importDefault(require("../models/plant_model"));
const article_model_1 = require("../models/article_model");
const user_model_1 = __importDefault(require("../models/user_model"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const explore_placement_model_1 = __importDefault(require("../models/explore_placement_model"));
const logger_1 = require("../utils/logger");
class AiRecommendationService {
    constructor() {
        this.ai = new genai_1.GoogleGenAI({ apiKey: env_1.env.GEMINI_API_KEY });
    }
    /**
     * Generates highly personalized content recommendations using Gemini-2.5-Flash
     */
    async generateRecommendations(userId, weatherData) {
        try {
            // 1. Gather User Context in parallel
            const [user, plants, diagnoses] = await Promise.all([
                user_model_1.default.findById(userId),
                plant_model_1.default.find({ user: userId }),
                diagnosis_history_model_1.default.find({ user: userId }).sort({ createdAt: -1 }).limit(3)
            ]);
            const interests = user?.interests || [];
            const plantContext = plants.map(p => `Species: ${p.scientificName || p.name} (Stage: ${p.stage}, Health: ${p.healthScore})`).join(', ');
            const diagnosisContext = diagnoses.map(d => `Disease: ${d.diseaseNameEn} (Severity: ${d.severity})`).join(', ');
            const weatherContext = weatherData ? `Temp: ${weatherData.temp}°C, Condition: ${weatherData.condition || 'normal'}, Humidity: ${weatherData.humidity || 'normal'}` : 'Normal weather';
            // 2. Fetch Candidate Contents
            const placements = await explore_placement_model_1.default.find({ isActive: true });
            const articles = await article_model_1.Article.find({ isPublished: true }).limit(15);
            // Map candidates into a unified structure for AI analysis
            const candidates = [
                ...placements.map(p => ({
                    id: p._id.toString(),
                    type: 'placement',
                    contentType: p.contentType,
                    title: p.title,
                    description: p.description,
                    tags: p.targetInterests || []
                })),
                ...articles.map(a => ({
                    id: a._id.toString(),
                    type: 'article',
                    contentType: 'article',
                    title: a.title,
                    description: a.body.slice(0, 150),
                    tags: a.tags || []
                }))
            ];
            if (candidates.length === 0) {
                return [];
            }
            // 3. Generate Gemini Recommendation Prompt
            const prompt = `You are Nabatech Discovery Recommendation Assistant. Your job is to select the top 5 most relevant content items for the user based on their context and provide a personalized recommendation reason for each (e.g. why it matches their plant growth stage, current dry/humid weather, or previous disease cases).
      
User Context:
- Active Plants: ${plantContext || 'No plants in garden yet'}
- Interests: ${interests.join(', ') || 'No specific interests selected'}
- Recent Plant Diseases Diagnosed: ${diagnosisContext || 'No recent diseases'}
- Local Weather: ${weatherContext}

Candidate Items to Recommend From:
${candidates.map((c, idx) => `[Item ${idx + 1}] ID: ${c.id} | Type: ${c.contentType} | Title: ${c.title} | Description: ${c.description} | Tags: ${c.tags.join(', ')}`).join('\n')}

Select the top 5 items. Return JSON:
{"recommendations": [{"id": "item_id", "reason": "A clear explanation why this is recommended based on the user's weather, plant growth stage, or disease history."}]}`;
            const res = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: 'You are Nabatech AI Recommendation Engine. Analyze user metadata and select the top relevant items with tailored reasoning.',
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: genai_1.Type.OBJECT,
                        properties: {
                            recommendations: {
                                type: genai_1.Type.ARRAY,
                                items: {
                                    type: genai_1.Type.OBJECT,
                                    properties: {
                                        id: { type: genai_1.Type.STRING },
                                        reason: { type: genai_1.Type.STRING }
                                    },
                                    required: ['id', 'reason']
                                }
                            }
                        },
                        required: ['recommendations']
                    }
                }
            });
            if (!res.text) {
                throw new Error('Empty response from Gemini recommendation engine');
            }
            const parsed = JSON.parse(res.text);
            const ranked = parsed.recommendations || [];
            // 4. Hydrate the selected items from original collections
            const resolvedRecommendations = [];
            for (const rec of ranked) {
                const cand = candidates.find(c => c.id === rec.id);
                if (!cand)
                    continue;
                if (cand.type === 'placement') {
                    const placementDoc = placements.find(p => p._id.toString() === rec.id);
                    if (placementDoc) {
                        resolvedRecommendations.push({
                            id: placementDoc._id,
                            contentType: placementDoc.contentType,
                            contentId: placementDoc.contentId,
                            title: placementDoc.title,
                            description: placementDoc.description,
                            imageUrl: placementDoc.imageUrl,
                            reason: rec.reason
                        });
                    }
                }
                else {
                    const articleDoc = articles.find(a => a._id.toString() === rec.id);
                    if (articleDoc) {
                        resolvedRecommendations.push({
                            id: articleDoc._id,
                            contentType: 'article',
                            contentId: articleDoc._id,
                            title: articleDoc.title,
                            description: articleDoc.body.slice(0, 150),
                            imageUrl: articleDoc.imageUrl || '',
                            reason: rec.reason
                        });
                    }
                }
            }
            return resolvedRecommendations;
        }
        catch (error) {
            logger_1.logger.error('Error in AiRecommendationService:', error);
            // Fallback: return first 5 active placements or articles
            const fallbackList = [];
            const activePlacements = await explore_placement_model_1.default.find({ isActive: true }).limit(5);
            for (const p of activePlacements) {
                fallbackList.push({
                    id: p._id,
                    contentType: p.contentType,
                    contentId: p.contentId,
                    title: p.title,
                    description: p.description,
                    imageUrl: p.imageUrl,
                    reason: "Recommended based on general popularity."
                });
            }
            return fallbackList;
        }
    }
}
exports.AiRecommendationService = AiRecommendationService;
