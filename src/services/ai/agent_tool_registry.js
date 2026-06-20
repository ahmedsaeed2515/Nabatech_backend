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
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentToolRegistry = exports.AGENT_TOOLS = void 0;
var ToolingService_1 = require("../ToolingService");
var WeatherService_1 = require("../WeatherService");
var PlantService_1 = require("../PlantService");
var CommunityService_1 = require("../CommunityService");
var TaskService_1 = require("../TaskService");
var mongoose_1 = __importDefault(require("mongoose"));
var task_model_1 = __importDefault(require("../../models/task_model"));
var article_model_1 = require("../../models/article_model");
var user_model_1 = __importDefault(require("../../models/user_model"));
var plant_dna_model_1 = __importDefault(require("../../models/plant_dna_model"));
var plant_model_1 = __importDefault(require("../../models/plant_model"));
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
var AgentToolRegistry = /** @class */ (function () {
    function AgentToolRegistry() {
        this.toolingService = new ToolingService_1.ToolingService();
        this.weatherService = new WeatherService_1.WeatherService();
        this.plantService = new PlantService_1.PlantService();
        this.communityService = new CommunityService_1.CommunityService();
        this.taskService = new TaskService_1.TaskService();
    }
    AgentToolRegistry.prototype.executeTool = function (name, args, userId, onProgress, settings) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, axios_1, baseUrl, res, e_1, PlantEmbeddingsService, libraryResults, foundDna, suggestions, sugNames, GardenModel, ZoneModel, garden, zone, targetPlant, weather, plants, enrichedPlants, forecast, post, task, articles, userPlants, speciesList, companionPrompt, getAiSettings, askLlm, settings_1, result, TreatmentSearchService, treatments, filter, experts, error_1;
            var _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 50, , 51]);
                        console.log("[AGENT_TOOL] Executing ".concat(name, " with args:"), args);
                        _a = name;
                        switch (_a) {
                            case "search_plant_library": return [3 /*break*/, 1];
                            case "plant_search": return [3 /*break*/, 6];
                            case "add_plant_to_garden": return [3 /*break*/, 9];
                            case "remove_plant_from_garden": return [3 /*break*/, 22];
                            case "get_weather": return [3 /*break*/, 25];
                            case "garden_analytics": return [3 /*break*/, 27];
                            case "get_weather_forecast": return [3 /*break*/, 29];
                            case "create_community_post": return [3 /*break*/, 31];
                            case "schedule_reminders": return [3 /*break*/, 33];
                            case "article_search": return [3 /*break*/, 35];
                            case "suggest_companion_plants": return [3 /*break*/, 37];
                            case "treatment_search": return [3 /*break*/, 43];
                            case "expert_search": return [3 /*break*/, 46];
                        }
                        return [3 /*break*/, 48];
                    case 1:
                        if (!((_b = settings === null || settings === void 0 ? void 0 : settings.rag) === null || _b === void 0 ? void 0 : _b.enabled)) {
                            return [2 /*return*/, "Plant library search is currently disabled or unavailable."];
                        }
                        if (onProgress)
                            onProgress("SEARCHING_RAG");
                        _c.label = 2;
                    case 2:
                        _c.trys.push([2, 5, , 6]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("axios")); })];
                    case 3:
                        axios_1 = (_c.sent()).default;
                        baseUrl = (settings.rag.endpointUrl || "http://localhost:8000").replace(/\/retrieve$/, "").replace(/\/$/, "");
                        return [4 /*yield*/, axios_1.post("".concat(baseUrl, "/retrieve"), { query: args.query, top_k: 5 }, { timeout: settings.rag.timeoutMs })];
                    case 4:
                        res = _c.sent();
                        return [2 /*return*/, JSON.stringify(res.data)];
                    case 5:
                        e_1 = _c.sent();
                        return [2 /*return*/, "Failed to search plant library: ".concat(e_1.message)];
                    case 6:
                        if (onProgress)
                            onProgress("SEARCHING_PLANTS");
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../plant_embeddings_service")); })];
                    case 7:
                        PlantEmbeddingsService = (_c.sent()).PlantEmbeddingsService;
                        return [4 /*yield*/, PlantEmbeddingsService.searchSimilarPlants(args.query, 5)];
                    case 8:
                        libraryResults = _c.sent();
                        return [2 /*return*/, JSON.stringify(libraryResults.map(function (p) { return ({ id: p.id, species: p.species || p.scientificName, scientificName: p.scientificName }); }))];
                    case 9:
                        if (onProgress)
                            onProgress("SAVING_GARDEN_ITEM");
                        return [4 /*yield*/, plant_dna_model_1.default.findOne({
                                $or: [
                                    { species: { $regex: "^".concat(args.plantName, "$"), $options: "i" } },
                                    { species: { $regex: args.plantName, $options: "i" } }
                                ]
                            })];
                    case 10:
                        foundDna = _c.sent();
                        if (!!foundDna) return [3 /*break*/, 12];
                        return [4 /*yield*/, plant_dna_model_1.default.find().limit(3)];
                    case 11:
                        suggestions = _c.sent();
                        sugNames = suggestions.map(function (s) { return s.species; }).join(", ");
                        return [2 /*return*/, "Error: Plant '".concat(args.plantName, "' is not recognized in the library. Try a known plant like: ").concat(sugNames, ".")];
                    case 12: return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../../models/garden_model")); })];
                    case 13:
                        GardenModel = (_c.sent()).default;
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../../models/zone_model")); })];
                    case 14:
                        ZoneModel = (_c.sent()).default;
                        return [4 /*yield*/, GardenModel.findOne({ user: userId })];
                    case 15:
                        garden = _c.sent();
                        if (!!garden) return [3 /*break*/, 17];
                        return [4 /*yield*/, GardenModel.create({
                                user: new mongoose_1.default.Types.ObjectId(userId),
                                name: "My Garden",
                                type: "INDOOR"
                            })];
                    case 16:
                        garden = _c.sent();
                        console.log("[AGENT_TOOL] Auto-created garden ".concat(garden._id, " for user ").concat(userId));
                        _c.label = 17;
                    case 17: return [4 /*yield*/, ZoneModel.findOne({ garden: garden._id, user: userId })];
                    case 18:
                        zone = _c.sent();
                        if (!!zone) return [3 /*break*/, 20];
                        return [4 /*yield*/, ZoneModel.create({
                                user: new mongoose_1.default.Types.ObjectId(userId),
                                garden: garden._id,
                                name: "Default Zone",
                                type: "PARTIAL_SHADE"
                            })];
                    case 19:
                        zone = _c.sent();
                        console.log("[AGENT_TOOL] Auto-created zone ".concat(zone._id, " in garden ").concat(garden._id));
                        _c.label = 20;
                    case 20: return [4 /*yield*/, this.plantService.createPlant(userId, zone._id.toString(), foundDna.id, foundDna.species)];
                    case 21:
                        _c.sent();
                        return [2 /*return*/, "Successfully added ".concat(foundDna.species, " to your garden (zone: ").concat(zone.name, ").")];
                    case 22:
                        if (onProgress)
                            onProgress("REMOVING_FROM_GARDEN");
                        return [4 /*yield*/, plant_model_1.default.findOne({
                                user: userId,
                                name: { $regex: "^".concat(args.plantName, "$"), $options: "i" }
                            })];
                    case 23:
                        targetPlant = _c.sent();
                        if (!targetPlant) {
                            return [2 /*return*/, "Error: You do not have a plant named '".concat(args.plantName, "' in your garden.")];
                        }
                        return [4 /*yield*/, plant_model_1.default.findByIdAndDelete(targetPlant.id)];
                    case 24:
                        _c.sent();
                        return [2 /*return*/, "Successfully removed ".concat(args.plantName, " from your garden.")];
                    case 25:
                        if (onProgress)
                            onProgress("FETCHING_WEATHER");
                        return [4 /*yield*/, this.weatherService.getCurrentWeather(args.lat, args.lon)];
                    case 26:
                        weather = _c.sent();
                        return [2 /*return*/, JSON.stringify(weather)];
                    case 27:
                        if (onProgress)
                            onProgress("ANALYZING_GARDEN");
                        return [4 /*yield*/, this.plantService.getPlantsByUser(userId)];
                    case 28:
                        plants = _c.sent();
                        enrichedPlants = plants.map(function (p) { return ({
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
                        }); });
                        return [2 /*return*/, JSON.stringify({
                                totalPlants: plants.length,
                                averageHealth: plants.length
                                    ? Math.round(plants.reduce(function (a, p) { return a + p.healthScore; }, 0) / plants.length)
                                    : 0,
                                plantsNeedingWater: enrichedPlants.filter(function (p) { return p.needsWater; }).map(function (p) { return p.name; }),
                                items: enrichedPlants
                            })];
                    case 29:
                        if (onProgress)
                            onProgress("FETCHING_FORECAST");
                        return [4 /*yield*/, this.weatherService.get7DayForecast(args.lat, args.lon)];
                    case 30:
                        forecast = _c.sent();
                        return [2 /*return*/, JSON.stringify(forecast)];
                    case 31:
                        if (onProgress)
                            onProgress("CREATING_POST");
                        return [4 /*yield*/, this.communityService.createPost(userId, args.content, args.imageUrl, args.plantTag, args.title)];
                    case 32:
                        post = _c.sent();
                        return [2 /*return*/, "Post created successfully with ID: ".concat(post.id)];
                    case 33:
                        if (onProgress)
                            onProgress("SCHEDULING_REMINDERS");
                        return [4 /*yield*/, task_model_1.default.create({
                                user: new mongoose_1.default.Types.ObjectId(userId),
                                title: args.title,
                                dueDate: new Date(args.date),
                                status: 'PENDING'
                            })];
                    case 34:
                        task = _c.sent();
                        return [2 /*return*/, "Scheduled task: ".concat(task.title, " for ").concat(task.dueDate.toISOString(), " with ID: ").concat(task.id)];
                    case 35:
                        if (onProgress)
                            onProgress("SEARCHING_ARTICLES");
                        return [4 /*yield*/, article_model_1.Article.find({
                                $or: [
                                    { title: { $regex: args.query, $options: "i" } },
                                    { body: { $regex: args.query, $options: "i" } }
                                ]
                            }).limit(3)];
                    case 36:
                        articles = _c.sent();
                        return [2 /*return*/, JSON.stringify(articles.map(function (a) { return ({ id: a.id, title: a.title, summary: (a.body || "").substring(0, 100) }); }))];
                    case 37:
                        // FIX [TASK-7.5]: Suggest compatible plants based on current garden
                        if (onProgress)
                            onProgress("ANALYZING_GARDEN_COMPOSITION");
                        return [4 /*yield*/, plant_model_1.default.find({ user: userId }).select('species name').lean()];
                    case 38:
                        userPlants = _c.sent();
                        speciesList = userPlants.map(function (p) { return p.species || p.name; }).join(', ');
                        if (!speciesList)
                            return [2 /*return*/, "No plants in your garden yet. Add some plants first!"];
                        companionPrompt = [
                            "The user currently grows: ".concat(speciesList),
                            'Suggest 3 companion plants that would benefit this garden.',
                            'Consider: pest control, soil nitrogen, pollinator attraction, shade/support.',
                            'Return JSON: {"suggestions": [{"plant": "name", "reason": "why it helps", "benefit": "specific benefit"}]}'
                        ].join('\n');
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("./ai_config_service")); })];
                    case 39:
                        getAiSettings = (_c.sent()).getAiSettings;
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("./llm_provider")); })];
                    case 40:
                        askLlm = (_c.sent()).askLlm;
                        return [4 /*yield*/, getAiSettings()];
                    case 41:
                        settings_1 = _c.sent();
                        return [4 /*yield*/, askLlm(settings_1, companionPrompt, "llm", [], "search")];
                    case 42:
                        result = _c.sent();
                        return [2 /*return*/, result.message];
                    case 43:
                        if (onProgress)
                            onProgress("SEARCHING_TREATMENTS");
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../TreatmentSearchService")); })];
                    case 44:
                        TreatmentSearchService = (_c.sent()).TreatmentSearchService;
                        return [4 /*yield*/, TreatmentSearchService.searchTreatments(args.diseaseName, 3)];
                    case 45:
                        treatments = _c.sent();
                        return [2 /*return*/, JSON.stringify(treatments.map(function (t) { return ({ disease: t.diseaseNameEn, advice: t.advice, severity: t.severity }); }))];
                    case 46:
                        if (onProgress)
                            onProgress("SEARCHING_EXPERTS");
                        filter = { role: "expert" };
                        return [4 /*yield*/, user_model_1.default.find(filter).limit(3)];
                    case 47:
                        experts = _c.sent();
                        // In a real scenario, you'd populate ExpertProfile for specialization and availability.
                        return [2 /*return*/, JSON.stringify(experts.map(function (e) { return ({ id: e.id, name: e.name || e.email }); }))];
                    case 48: return [2 /*return*/, "Tool ".concat(name, " is not implemented yet.")];
                    case 49: return [3 /*break*/, 51];
                    case 50:
                        error_1 = _c.sent();
                        console.error("[AGENT_TOOL_ERROR] Failed to execute ".concat(name, ":"), error_1);
                        return [2 /*return*/, "Error executing tool: ".concat(error_1.message)];
                    case 51: return [2 /*return*/];
                }
            });
        });
    };
    return AgentToolRegistry;
}());
exports.AgentToolRegistry = AgentToolRegistry;
