import { ToolingService } from "../ToolingService";
import { WeatherService } from "../WeatherService";
import { PlantService } from "../PlantService";
import { CommunityService } from "../CommunityService";
import { TaskService } from "../TaskService";
import mongoose from "mongoose";
import Task from "../../models/task_model";
import { Article } from "../../models/article_model";
import { DiseaseKnowledgeRecord } from "../../models/disease_knowledge_record_model";
import User from "../../models/user_model";
import PlantDnaModel from "../../models/plant_dna_model";
import PlantModel from "../../models/plant_model";

export type AgentToolDefinition = {
  name: string;
  description: string;
  parameters: any;
};

export const AGENT_TOOLS: AgentToolDefinition[] = [
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

export class AgentToolRegistry {
  private toolingService = new ToolingService();
  private weatherService = new WeatherService();
  private plantService = new PlantService();
  private communityService = new CommunityService();
  private taskService = new TaskService();

  async executeTool(name: string, args: any, userId: string, onProgress?: (phase: string) => void, settings?: any): Promise<string> {
    try {
      console.log(`[AGENT_TOOL] Executing ${name} with args:`, args);
      switch (name) {
        case "search_plant_library":
          if (!settings?.rag?.enabled) {
            return "Plant library search is currently disabled or unavailable.";
          }
          if (onProgress) onProgress("SEARCHING_RAG");
          try {
            const axios = (await import("axios")).default;
            const baseUrl = (settings.rag.endpointUrl || "http://localhost:8000").replace(/\/retrieve$/, "").replace(/\/$/, "");
            const res = await axios.post(`${baseUrl}/retrieve`, { query: args.query, top_k: 5 }, { timeout: settings.rag.timeoutMs });
            return JSON.stringify(res.data);
          } catch (e: any) {
            return `Failed to search plant library: ${e.message}`;
          }

        case "plant_search":
          if (onProgress) onProgress("SEARCHING_PLANTS");
          const PlantEmbeddingsService = (await import("../plant_embeddings_service")).PlantEmbeddingsService;
          const libraryResults = await PlantEmbeddingsService.searchSimilarPlants(args.query, 5);
          return JSON.stringify(libraryResults.map((p: any) => ({ id: p.id, species: p.species || p.scientificName, scientificName: p.scientificName })));
        
        case "add_plant_to_garden":
          if (onProgress) onProgress("SAVING_GARDEN_ITEM");
          // Validate existence
          let foundDna = await PlantDnaModel.findOne({
            $or: [
              { species: { $regex: `^${args.plantName}$`, $options: "i" } },
              { species: { $regex: args.plantName, $options: "i" } }
            ]
          });
          
          if (!foundDna) {
            console.log(`[AGENT_TOOL] Auto-creating missing PlantDNA for ${args.plantName}`);
            foundDna = await PlantDnaModel.create({
              species: args.plantName,
              scientificName: args.plantName,
              toxicity: false,
              minTemp: 15,
              maxTemp: 30,
              lightReq: "Partial Sun",
              waterFrequencyDays: 3
            });
          }

          // ✅ FIX: Auto-find or create real garden + zone for this user
          const GardenModel = (await import("../../models/garden_model")).default;
          const ZoneModel = (await import("../../models/zone_model")).default;

          let garden = await GardenModel.findOne({ user: userId });
          if (!garden) {
            garden = await GardenModel.create({
              user: new mongoose.Types.ObjectId(userId),
              name: "My Garden",
              type: "INDOOR"
            });
            console.log(`[AGENT_TOOL] Auto-created garden ${garden._id} for user ${userId}`);
          }

          let zone = await ZoneModel.findOne({ garden: garden._id, user: userId });
          if (!zone) {
            zone = await ZoneModel.create({
              user: new mongoose.Types.ObjectId(userId),
              garden: garden._id,
              name: "Default Zone",
              type: "PARTIAL_SHADE"
            });
            console.log(`[AGENT_TOOL] Auto-created zone ${zone._id} in garden ${garden._id}`);
          }

          await this.plantService.createPlant(userId, zone._id.toString(), foundDna.id, foundDna.species);
          return `Successfully added ${foundDna.species} to your garden (zone: ${zone.name}).`;

        case "remove_plant_from_garden":
          if (onProgress) onProgress("REMOVING_FROM_GARDEN");
          const targetPlant = await PlantModel.findOne({
            user: userId,
            name: { $regex: `^${args.plantName}$`, $options: "i" }
          });
          
          if (!targetPlant) {
            return `Error: You do not have a plant named '${args.plantName}' in your garden.`;
          }
          
          await PlantModel.findByIdAndDelete(targetPlant.id);
          return `Successfully removed ${args.plantName} from your garden.`;

        case "get_weather":
          if (onProgress) onProgress("FETCHING_WEATHER");
          const weather = await this.weatherService.getCurrentWeather(args.lat, args.lon);
          return JSON.stringify(weather);

        case "garden_analytics":
          if (onProgress) onProgress("ANALYZING_GARDEN");
          const plants = await this.plantService.getPlantsByUser(userId);
          const enrichedPlants = plants.map(p => ({
            name: p.name,
            stage: p.stage,
            healthScore: p.healthScore,
            lastWatered: p.lastWatered,
            daysWithoutWater: p.lastWatered
              ? Math.floor((Date.now() - new Date(p.lastWatered).getTime()) / 86_400_000)
              : null,
            needsWater: p.lastWatered
              ? Math.floor((Date.now() - new Date(p.lastWatered).getTime()) / 86_400_000) > 2
              : true,
            careLevel: (p as any).careLevel || "Unknown"
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
          if (onProgress) onProgress("FETCHING_FORECAST");
          const forecast = await this.weatherService.get7DayForecast(args.lat, args.lon);
          return JSON.stringify(forecast);

        case "create_community_post":
          if (onProgress) onProgress("CREATING_POST");
          
          // Safety Layer: Check if intent is real or hypothetical
          if (!args.title || !args.content) {
            throw new Error("Missing required fields for community post.");
          }

          const { createPostSchema } = await import("../../validation/community_schemas");
          const CommunityPost = (await import("../../models/community_post_model")).default;
          const CommunityAudit = (await import("../../models/community_audit_model")).default;

          // Validation Consistency: reuse REST schema (strip clientOperationId since AI doesn't have it)
          const validArgs = createPostSchema.shape.body.omit({ clientOperationId: true }).parse({
            title: args.title,
            content: args.content,
            plantTag: args.plantTag || "General"
          });

          // Rate Limiting: max 10 AI posts per day per user
          const startOfDay = new Date();
          startOfDay.setHours(0,0,0,0);
          const aiPostCount = await CommunityPost.countDocuments({ 
            author: new mongoose.Types.ObjectId(userId), 
            createdByAI: true, 
            createdAt: { $gte: startOfDay } 
          });
          if (aiPostCount >= 10) {
            throw new Error("You have reached the daily limit of 10 AI-generated community posts.");
          }

          const post = await this.communityService.createPost(
            userId,
            validArgs.content,
            args.imageUrl,
            validArgs.plantTag,
            validArgs.title,
            true // createdByAI = true
          );

          // Audit Logging
          await CommunityAudit.create({
            actor: new mongoose.Types.ObjectId(userId),
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
          if (onProgress) onProgress("SCHEDULING_REMINDERS");
          const task = await Task.create({
            user: new mongoose.Types.ObjectId(userId),
            title: args.title,
            dueDate: new Date(args.date),
            status: 'PENDING'
          });
          return `Scheduled task: ${task.title} for ${task.dueDate.toISOString()} with ID: ${task.id}`;

        case "article_search":
          if (onProgress) onProgress("SEARCHING_ARTICLES");
          const articles = await Article.find({
            $or: [
              { title: { $regex: args.query, $options: "i" } },
              { body: { $regex: args.query, $options: "i" } }
            ]
          }).limit(3);
          return JSON.stringify(articles.map((a: any) => ({ id: a.id, title: a.title, summary: (a.body || "").substring(0, 100) })));

        case "suggest_companion_plants": {
          // FIX [TASK-7.5]: Suggest compatible plants based on current garden
          if (onProgress) onProgress("ANALYZING_GARDEN_COMPOSITION");
        
          const userPlants = await PlantModel.find({ user: userId }).select('species name').lean();
          const speciesList = userPlants.map((p: any) => p.species || p.name).join(', ');
        
          if (!speciesList) return "No plants in your garden yet. Add some plants first!";
        
          const companionPrompt = [
            `The user currently grows: ${speciesList}`,
            'Suggest 3 companion plants that would benefit this garden.',
            'Consider: pest control, soil nitrogen, pollinator attraction, shade/support.',
            'Return JSON: {"suggestions": [{"plant": "name", "reason": "why it helps", "benefit": "specific benefit"}]}'
          ].join('\n');
          
          const { getAiSettings } = await import("./ai_config_service");
          const { askLlm } = await import("./llm_provider");
          const settings = await getAiSettings();
          const result = await askLlm(settings, companionPrompt, "llm", [], "search");
          return result.message;
        }

        case "treatment_search":
          if (onProgress) onProgress("SEARCHING_TREATMENTS");
          const TreatmentSearchService = (await import("../TreatmentSearchService")).TreatmentSearchService;
          const treatments = await TreatmentSearchService.searchTreatments(args.diseaseName, 3);
          return JSON.stringify(treatments.map((t: any) => ({ disease: t.diseaseNameEn, advice: t.advice, severity: t.severity })));

        case "expert_search":
          if (onProgress) onProgress("SEARCHING_EXPERTS");
          const filter: any = { role: "expert" };
          // Assume specialization filter could be applied via text search or specific field if exists
          const experts = await User.find(filter).limit(3);
          // In a real scenario, you'd populate ExpertProfile for specialization and availability.
          return JSON.stringify(experts.map((e: any) => ({ id: e.id, name: e.name || e.email })));

        default:
          return `Tool ${name} is not implemented yet.`;
      }
    } catch (error: any) {
      console.error(`[AGENT_TOOL_ERROR] Failed to execute ${name}:`, error);
      return `Error executing tool: ${error.message}`;
    }
  }
}
