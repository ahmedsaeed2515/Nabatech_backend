"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentToolRegistry = exports.AGENT_TOOLS = void 0;
const ToolingService_1 = require("../ToolingService");
const WeatherService_1 = require("../WeatherService");
const PlantService_1 = require("../PlantService");
const CommunityService_1 = require("../CommunityService");
const TaskService_1 = require("../TaskService");
const mongoose_1 = __importDefault(require("mongoose"));
const task_model_1 = __importDefault(require("../../models/task_model"));
const article_model_1 = require("../../models/article_model");
const user_model_1 = __importDefault(require("../../models/user_model"));
const plant_dna_model_1 = __importDefault(require("../../models/plant_dna_model"));
const plant_model_1 = __importDefault(require("../../models/plant_model"));
exports.AGENT_TOOLS = [
    {
        name: "search_plant_library",
        description: "Search the RAG plant library for detailed knowledge about plant care or diseases.",
        parameters: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"]
        }
    },
    {
        name: "plant_search",
        description: "Search for a plant in the global plant library by name.",
        parameters: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"]
        }
    },
    {
        name: "add_plant_to_garden",
        description: "Add a specific plant to the user's personal garden.",
        parameters: {
            type: "object",
            properties: {
                plantName: { type: "string" },
                imageUrl: { type: "string", description: "Optional image URL of the plant" },
                zoneId: { type: "string", description: "Optional zone ID to place the plant in" }
            },
            required: ["plantName"]
        }
    },
    {
        name: "remove_plant_from_garden",
        description: "Remove a plant from the user's personal garden.",
        parameters: {
            type: "object",
            properties: {
                plantName: { type: "string" }
            },
            required: ["plantName"]
        }
    },
    {
        name: "get_weather",
        description: "Get current weather for the user's garden location.",
        parameters: {
            type: "object",
            properties: { lat: { type: "number" }, lon: { type: "number" } },
            required: ["lat", "lon"]
        }
    },
    {
        name: "garden_analytics",
        description: "Get analytics, health summary, and watering urgency of the user's garden.",
        parameters: { type: "object", properties: {}, required: [] }
    },
    {
        name: "get_weather_forecast",
        description: "Get the 7-day weather forecast for the user's location. Useful for irrigation planning.",
        parameters: {
            type: "object",
            properties: { lat: { type: "number" }, lon: { type: "number" } },
            required: ["lat", "lon"]
        }
    },
    {
        name: "create_community_post",
        description: "Publish a post to the Nabatech community.",
        parameters: {
            type: "object",
            properties: {
                content: { type: "string" },
                title: { type: "string" },
                plantTag: { type: "string", enum: ["Diagnosis", "Care Tips", "Watering", "Pests", "General"] },
                imageUrl: { type: "string" }
            },
            required: ["content", "title", "plantTag"]
        }
    },
    {
        name: "schedule_reminders",
        description: "Create a watering or care reminder task.",
        parameters: {
            type: "object",
            properties: { title: { type: "string" }, date: { type: "string" } },
            required: ["title", "date"]
        }
    },
    {
        name: "article_search",
        description: "Search for agricultural articles.",
        parameters: {
            type: "object",
            properties: { query: { type: "string" } },
            required: ["query"]
        }
    },
    {
        name: "treatment_search",
        description: "Search for treatments for a specific plant disease.",
        parameters: {
            type: "object",
            properties: { diseaseName: { type: "string" } },
            required: ["diseaseName"]
        }
    },
    {
        name: "expert_search",
        description: "Search for agricultural experts.",
        parameters: {
            type: "object",
            properties: { specialization: { type: "string" } },
            required: []
        }
    },
    {
        name: "suggest_companion_plants",
        description: "Suggest compatible plants based on current garden composition.",
        parameters: { type: "object", properties: {}, required: [] }
    }
];
class AgentToolRegistry {
    constructor() {
        this.toolingService = new ToolingService_1.ToolingService();
        this.weatherService = new WeatherService_1.WeatherService();
        this.plantService = new PlantService_1.PlantService();
        this.communityService = new CommunityService_1.CommunityService();
        this.taskService = new TaskService_1.TaskService();
    }
    async executeTool(name, args, userId, onProgress, settings) {
        try {
            console.log(`[AGENT_TOOL] Executing ${name} with args:`, args);
            switch (name) {
                case "search_plant_library":
                    if (!settings?.rag?.enabled) {
                        return "Plant library search is currently disabled or unavailable.";
                    }
                    if (onProgress)
                        onProgress("SEARCHING_RAG");
                    try {
                        const axios = (await Promise.resolve().then(() => __importStar(require("axios")))).default;
                        const baseUrl = (settings.rag.endpointUrl || "http://localhost:8000").replace(/\/retrieve$/, "").replace(/\/$/, "");
                        const res = await axios.post(`${baseUrl}/retrieve`, { query: args.query, top_k: 5 }, { timeout: settings.rag.timeoutMs });
                        return JSON.stringify(res.data);
                    }
                    catch (e) {
                        return `Failed to search plant library: ${e.message}`;
                    }
                case "plant_search":
                    if (onProgress)
                        onProgress("SEARCHING_PLANTS");
                    const PlantEmbeddingsService = (await Promise.resolve().then(() => __importStar(require("../plant_embeddings_service")))).PlantEmbeddingsService;
                    const libraryResults = await PlantEmbeddingsService.searchSimilarPlants(args.query, 5);
                    return JSON.stringify(libraryResults.map((p) => ({ id: p.id, species: p.species || p.scientificName, scientificName: p.scientificName })));
                case "add_plant_to_garden":
                    if (onProgress)
                        onProgress("SAVING_GARDEN_ITEM");
                    console.log("\n[DEBUG_RUNTIME] Tool Input:", JSON.stringify(args, null, 2));
                    // Validate existence - using strict exact match or strict prefix match
                    const lookupQuery = {
                        $or: [
                            { species: { $regex: `^${args.plantName}$`, $options: "i" } },
                            { species: { $regex: `^${args.plantName}\\b`, $options: "i" } }
                        ]
                    };
                    console.log("\n[DEBUG_RUNTIME] PlantDna lookup query:", JSON.stringify(lookupQuery, null, 2));
                    let foundDna = await plant_dna_model_1.default.findOne(lookupQuery);
                    console.log("\n[DEBUG_RUNTIME] Plant DNA Found:", foundDna ? foundDna.toObject() : "NONE - Triggering Fallback");
                    let isGenerated = false;
                    if (!foundDna) {
                        console.warn(`[AGENT_TOOL] PlantDNA for ${args.plantName} not found in database. Generating dynamically via LLM...`);
                        try {
                            const { getAiSettings } = await Promise.resolve().then(() => __importStar(require("./ai_config_service")));
                            const { askLlm } = await Promise.resolve().then(() => __importStar(require("./llm_provider")));
                            const settings = await getAiSettings();
                            const prompt = `You are a botanical expert. The user wants to add "${args.plantName}" to their garden, but we don't have its profile.
Generate a complete JSON profile for this plant. 
DO NOT INCLUDE ANY MARKDOWN formatting like \`\`\`json. ONLY RETURN RAW VALID JSON.
The JSON must strictly match this structure:
{
  "scientificName": "Scientific name here",
  "lightRequirements": "e.g., Full Sun, Partial Shade",
  "waterFrequencyDays": 7,
  "minTemp": 10,
  "maxTemp": 30,
  "soilType": "e.g., Well-draining loamy soil",
  "humidity": "e.g., High humidity 60-80%",
  "description": "A short 1-2 sentence description of the plant."
}`;
                            const llmResponse = await askLlm(settings, prompt, "llm", [], "search");
                            const match = llmResponse.message.match(/\{[\s\S]*\}/);
                            if (!match)
                                throw new Error("LLM did not return a JSON object.");
                            const parsedData = JSON.parse(match[0]);
                            console.log("[AGENT_TOOL] Successfully generated profile via LLM:", parsedData);
                            foundDna = await plant_dna_model_1.default.create({
                                species: args.plantName,
                                scientificName: parsedData.scientificName || args.plantName,
                                toxicity: false,
                                minTemp: parsedData.minTemp || 15,
                                maxTemp: parsedData.maxTemp || 30,
                                lightReq: parsedData.lightRequirements || "Partial Sun",
                                waterFrequencyDays: parsedData.waterFrequencyDays || 7,
                                soilType: parsedData.soilType,
                                humidity: parsedData.humidity,
                                description: parsedData.description,
                                source: "AI_GENERATED",
                                verified: false,
                                generatedAt: new Date()
                            });
                            isGenerated = true;
                        }
                        catch (err) {
                            console.error("[AGENT_TOOL] Failed to generate profile via LLM:", err.message);
                            return JSON.stringify({ error: `Plant species '${args.plantName}' not found and AI fallback failed. Cannot add to garden.` });
                        }
                    }
                    // ✅ FIX: Auto-find or create real garden + zone for this user
                    const GardenModel = (await Promise.resolve().then(() => __importStar(require("../../models/garden_model")))).default;
                    const ZoneModel = (await Promise.resolve().then(() => __importStar(require("../../models/zone_model")))).default;
                    let garden = await GardenModel.findOne({ user: userId });
                    if (!garden) {
                        garden = await GardenModel.create({
                            user: new mongoose_1.default.Types.ObjectId(userId),
                            name: "My Garden",
                            type: "INDOOR"
                        });
                        console.log(`[AGENT_TOOL] Auto-created garden ${garden._id} for user ${userId}`);
                    }
                    let zone = await ZoneModel.findOne({ garden: garden._id, user: userId });
                    if (!zone) {
                        zone = await ZoneModel.create({
                            user: new mongoose_1.default.Types.ObjectId(userId),
                            garden: garden._id,
                            name: "Default Zone",
                            type: "PARTIAL_SHADE"
                        });
                        console.log(`[AGENT_TOOL] Auto-created zone ${zone._id} in garden ${garden._id}`);
                    }
                    await this.plantService.createPlant(userId, zone._id.toString(), foundDna.id, foundDna.species, args.imageUrl);
                    const metaString = isGenerated ? "[Source: AI Generated Profile (Unverified)]" : "[Source: Verified Dictionary]";
                    return `Successfully added ${foundDna.species} to your garden (zone: ${zone.name}). ${metaString}`;
                case "remove_plant_from_garden":
                    if (onProgress)
                        onProgress("REMOVING_FROM_GARDEN");
                    const targetPlant = await plant_model_1.default.findOne({
                        user: userId,
                        name: { $regex: `^${args.plantName}$`, $options: "i" }
                    });
                    if (!targetPlant) {
                        return `Error: You do not have a plant named '${args.plantName}' in your garden.`;
                    }
                    await plant_model_1.default.findByIdAndDelete(targetPlant.id);
                    return `Successfully removed ${args.plantName} from your garden.`;
                case "get_weather":
                    if (onProgress)
                        onProgress("FETCHING_WEATHER");
                    const weather = await this.weatherService.getCurrentWeather(args.lat, args.lon);
                    return JSON.stringify(weather);
                case "garden_analytics":
                    if (onProgress)
                        onProgress("ANALYZING_GARDEN");
                    const plants = await this.plantService.getPlantsByUser(userId);
                    const enrichedPlants = plants.map(p => ({
                        name: p.name,
                        stage: p.stage,
                        healthScore: p.healthScore,
                        lastWatered: p.lastWatered,
                        daysWithoutWater: p.lastWatered
                            ? Math.floor((Date.now() - new Date(p.lastWatered).getTime()) / 86400000)
                            : null,
                        needsWater: p.lastWatered
                            ? Math.floor((Date.now() - new Date(p.lastWatered).getTime()) / 86400000) > 2
                            : true,
                        careLevel: p.careLevel || "Unknown"
                    }));
                    return JSON.stringify({
                        totalPlants: plants.length,
                        averageHealth: plants.length
                            ? Math.round(plants.reduce((a, p) => a + p.healthScore, 0) / plants.length)
                            : 0,
                        plantsNeedingWater: enrichedPlants.filter(p => p.needsWater).map(p => p.name),
                        items: enrichedPlants
                    });
                case "get_weather_forecast":
                    if (onProgress)
                        onProgress("FETCHING_FORECAST");
                    const forecast = await this.weatherService.get7DayForecast(args.lat, args.lon);
                    return JSON.stringify(forecast);
                case "create_community_post":
                    if (onProgress)
                        onProgress("CREATING_POST");
                    // Safety Layer: Check if intent is real or hypothetical
                    if (!args.title || !args.content) {
                        throw new Error("Missing required fields for community post.");
                    }
                    const { createPostSchema } = await Promise.resolve().then(() => __importStar(require("../../validation/community_schemas")));
                    const CommunityPost = (await Promise.resolve().then(() => __importStar(require("../../models/community_post_model")))).default;
                    const CommunityAudit = (await Promise.resolve().then(() => __importStar(require("../../models/community_audit_model")))).default;
                    // Validation Consistency: reuse REST schema (strip clientOperationId since AI doesn't have it)
                    const validArgs = createPostSchema.shape.body.omit({ clientOperationId: true }).parse({
                        title: args.title,
                        content: args.content,
                        plantTag: args.plantTag || "General"
                    });
                    // Rate Limiting: max 10 AI posts per day per user
                    const startOfDay = new Date();
                    startOfDay.setHours(0, 0, 0, 0);
                    const aiPostCount = await CommunityPost.countDocuments({
                        author: new mongoose_1.default.Types.ObjectId(userId),
                        createdByAI: true,
                        createdAt: { $gte: startOfDay }
                    });
                    if (aiPostCount >= 10) {
                        throw new Error("You have reached the daily limit of 10 AI-generated community posts.");
                    }
                    const post = await this.communityService.createPost(userId, validArgs.content, args.imageUrl, validArgs.plantTag, validArgs.title, true // createdByAI = true
                    );
                    // Audit Logging
                    await CommunityAudit.create({
                        actor: new mongoose_1.default.Types.ObjectId(userId),
                        action: "CREATE_POST_AI",
                        targetType: "CommunityPost",
                        targetId: post._id,
                        metadata: { source: "AI", toolCall: true }
                    });
                    // Deep Link Return
                    return JSON.stringify({
                        success: true,
                        message: "Post created successfully",
                        postId: post._id,
                        deepLink: `/community/post/${post._id}`
                    });
                case "schedule_reminders":
                    if (onProgress)
                        onProgress("SCHEDULING_REMINDERS");
                    const task = await task_model_1.default.create({
                        user: new mongoose_1.default.Types.ObjectId(userId),
                        title: args.title,
                        dueDate: new Date(args.date),
                        status: 'PENDING'
                    });
                    return `Scheduled task: ${task.title} for ${task.dueDate.toISOString()} with ID: ${task.id}`;
                case "article_search":
                    if (onProgress)
                        onProgress("SEARCHING_ARTICLES");
                    const articles = await article_model_1.Article.find({
                        $or: [
                            { title: { $regex: args.query, $options: "i" } },
                            { body: { $regex: args.query, $options: "i" } }
                        ]
                    }).limit(3);
                    return JSON.stringify(articles.map((a) => ({ id: a.id, title: a.title, summary: (a.body || "").substring(0, 100) })));
                case "suggest_companion_plants": {
                    // FIX [TASK-7.5]: Suggest compatible plants based on current garden
                    if (onProgress)
                        onProgress("ANALYZING_GARDEN_COMPOSITION");
                    const userPlants = await plant_model_1.default.find({ user: userId }).select('species name').lean();
                    const speciesList = userPlants.map((p) => p.species || p.name).join(', ');
                    if (!speciesList)
                        return "No plants in your garden yet. Add some plants first!";
                    const companionPrompt = [
                        `The user currently grows: ${speciesList}`,
                        'Suggest 3 companion plants that would benefit this garden.',
                        'Consider: pest control, soil nitrogen, pollinator attraction, shade/support.',
                        'Return JSON: {"suggestions": [{"plant": "name", "reason": "why it helps", "benefit": "specific benefit"}]}'
                    ].join('\n');
                    const { getAiSettings } = await Promise.resolve().then(() => __importStar(require("./ai_config_service")));
                    const { askLlm } = await Promise.resolve().then(() => __importStar(require("./llm_provider")));
                    const settings = await getAiSettings();
                    const result = await askLlm(settings, companionPrompt, "llm", [], "search");
                    return result.message;
                }
                case "treatment_search":
                    if (onProgress)
                        onProgress("SEARCHING_TREATMENTS");
                    const TreatmentSearchService = (await Promise.resolve().then(() => __importStar(require("../TreatmentSearchService")))).TreatmentSearchService;
                    const treatments = await TreatmentSearchService.searchTreatments(args.diseaseName, 3);
                    return JSON.stringify(treatments.map((t) => ({ disease: t.diseaseNameEn, advice: t.advice, severity: t.severity })));
                case "expert_search":
                    if (onProgress)
                        onProgress("SEARCHING_EXPERTS");
                    const filter = { role: "expert" };
                    // Assume specialization filter could be applied via text search or specific field if exists
                    const experts = await user_model_1.default.find(filter).limit(3);
                    // In a real scenario, you'd populate ExpertProfile for specialization and availability.
                    return JSON.stringify(experts.map((e) => ({ id: e.id, name: e.name || e.email })));
                default:
                    return `Tool ${name} is not implemented yet.`;
            }
        }
        catch (error) {
            console.error(`[AGENT_TOOL_ERROR] Failed to execute ${name}:`, error);
            return `Error executing tool: ${error.message}`;
        }
    }
}
exports.AgentToolRegistry = AgentToolRegistry;
