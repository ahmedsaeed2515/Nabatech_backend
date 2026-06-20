"use strict";
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiRecommendationService = void 0;
var genai_1 = require("@google/genai");
var env_1 = require("../config/env");
var plant_model_1 = __importDefault(require("../models/plant_model"));
var article_model_1 = require("../models/article_model");
var user_model_1 = __importDefault(require("../models/user_model"));
var diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
var explore_placement_model_1 = __importDefault(require("../models/explore_placement_model"));
var logger_1 = require("../utils/logger");
var AiRecommendationService = /** @class */ (function () {
    function AiRecommendationService() {
        this.ai = new genai_1.GoogleGenAI({ apiKey: env_1.env.GEMINI_API_KEY });
    }
    /**
     * Generates highly personalized content recommendations using Gemini-2.5-Flash
     */
    AiRecommendationService.prototype.generateRecommendations = function (userId, weatherData) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, user, plants, diagnoses, interests, plantContext, diagnosisContext, weatherContext, placements, articles, candidates, prompt_1, res, parsed, ranked, resolvedRecommendations, _loop_1, _i, ranked_1, rec, error_1, fallbackList, activePlacements, _b, activePlacements_1, p;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        _c.trys.push([0, 5, , 7]);
                        return [4 /*yield*/, Promise.all([
                                user_model_1.default.findById(userId),
                                plant_model_1.default.find({ user: userId }),
                                diagnosis_history_model_1.default.find({ user: userId }).sort({ createdAt: -1 }).limit(3)
                            ])];
                    case 1:
                        _a = _c.sent(), user = _a[0], plants = _a[1], diagnoses = _a[2];
                        interests = (user === null || user === void 0 ? void 0 : user.interests) || [];
                        plantContext = plants.map(function (p) { return "Species: ".concat(p.scientificName || p.name, " (Stage: ").concat(p.stage, ", Health: ").concat(p.healthScore, ")"); }).join(', ');
                        diagnosisContext = diagnoses.map(function (d) { return "Disease: ".concat(d.diseaseNameEn, " (Severity: ").concat(d.severity, ")"); }).join(', ');
                        weatherContext = weatherData ? "Temp: ".concat(weatherData.temp, "\u00B0C, Condition: ").concat(weatherData.condition || 'normal', ", Humidity: ").concat(weatherData.humidity || 'normal') : 'Normal weather';
                        return [4 /*yield*/, explore_placement_model_1.default.find({ isActive: true })];
                    case 2:
                        placements = _c.sent();
                        return [4 /*yield*/, article_model_1.Article.find({ isPublished: true }).limit(15)];
                    case 3:
                        articles = _c.sent();
                        candidates = __spreadArray(__spreadArray([], placements.map(function (p) { return ({
                            id: p._id.toString(),
                            type: 'placement',
                            contentType: p.contentType,
                            title: p.title,
                            description: p.description,
                            tags: p.targetInterests || []
                        }); }), true), articles.map(function (a) { return ({
                            id: a._id.toString(),
                            type: 'article',
                            contentType: 'article',
                            title: a.title,
                            description: a.body.slice(0, 150),
                            tags: a.tags || []
                        }); }), true);
                        if (candidates.length === 0) {
                            return [2 /*return*/, []];
                        }
                        prompt_1 = "You are Nabatech Discovery Recommendation Assistant. Your job is to select the top 5 most relevant content items for the user based on their context and provide a personalized recommendation reason for each (e.g. why it matches their plant growth stage, current dry/humid weather, or previous disease cases).\n      \nUser Context:\n- Active Plants: ".concat(plantContext || 'No plants in garden yet', "\n- Interests: ").concat(interests.join(', ') || 'No specific interests selected', "\n- Recent Plant Diseases Diagnosed: ").concat(diagnosisContext || 'No recent diseases', "\n- Local Weather: ").concat(weatherContext, "\n\nCandidate Items to Recommend From:\n").concat(candidates.map(function (c, idx) { return "[Item ".concat(idx + 1, "] ID: ").concat(c.id, " | Type: ").concat(c.contentType, " | Title: ").concat(c.title, " | Description: ").concat(c.description, " | Tags: ").concat(c.tags.join(', ')); }).join('\n'), "\n\nSelect the top 5 items. Return JSON:\n{\"recommendations\": [{\"id\": \"item_id\", \"reason\": \"A clear explanation why this is recommended based on the user's weather, plant growth stage, or disease history.\"}]}");
                        return [4 /*yield*/, this.ai.models.generateContent({
                                model: 'gemini-2.5-flash',
                                contents: prompt_1,
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
                            })];
                    case 4:
                        res = _c.sent();
                        if (!res.text) {
                            throw new Error('Empty response from Gemini recommendation engine');
                        }
                        parsed = JSON.parse(res.text);
                        ranked = parsed.recommendations || [];
                        resolvedRecommendations = [];
                        _loop_1 = function (rec) {
                            var cand = candidates.find(function (c) { return c.id === rec.id; });
                            if (!cand)
                                return "continue";
                            if (cand.type === 'placement') {
                                var placementDoc = placements.find(function (p) { return p._id.toString() === rec.id; });
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
                                var articleDoc = articles.find(function (a) { return a._id.toString() === rec.id; });
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
                        };
                        for (_i = 0, ranked_1 = ranked; _i < ranked_1.length; _i++) {
                            rec = ranked_1[_i];
                            _loop_1(rec);
                        }
                        return [2 /*return*/, resolvedRecommendations];
                    case 5:
                        error_1 = _c.sent();
                        logger_1.logger.error('Error in AiRecommendationService:', error_1);
                        fallbackList = [];
                        return [4 /*yield*/, explore_placement_model_1.default.find({ isActive: true }).limit(5)];
                    case 6:
                        activePlacements = _c.sent();
                        for (_b = 0, activePlacements_1 = activePlacements; _b < activePlacements_1.length; _b++) {
                            p = activePlacements_1[_b];
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
                        return [2 /*return*/, fallbackList];
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return AiRecommendationService;
}());
exports.AiRecommendationService = AiRecommendationService;
