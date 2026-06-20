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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiOrchestratorService = void 0;
var genai_1 = require("@google/genai");
var PlantRepository_1 = require("../repositories/PlantRepository");
var env_1 = require("../config/env");
var logger_1 = require("../utils/logger");
var AiOrchestratorService = /** @class */ (function () {
    function AiOrchestratorService() {
        this.ai = new genai_1.GoogleGenAI({ apiKey: env_1.env.GEMINI_API_KEY });
        this.plantRepo = new PlantRepository_1.PlantRepository();
    }
    AiOrchestratorService.prototype.getMergedUserPlants = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var plants;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.plantRepo.findByUserId(userId)];
                    case 1:
                        plants = _a.sent();
                        return [2 /*return*/, plants.map(function (p) { return ({
                                id: p._id.toString(),
                                name: p.name,
                                species: p.scientificName || 'Unknown',
                                stage: p.stage,
                                healthScore: p.healthScore,
                                lastWatered: p.lastWatered,
                            }); })];
                }
            });
        });
    };
    AiOrchestratorService.prototype.processChat = function (userId, message) {
        return __awaiter(this, void 0, void 0, function () {
            var plants, minifiedPlants, contextStr, systemInstruction, response, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMergedUserPlants(userId)];
                    case 1:
                        plants = _a.sent();
                        minifiedPlants = plants.map(function (p) { return ({
                            name: p.name,
                            stage: p.stage,
                            healthScore: p.healthScore
                        }); });
                        contextStr = JSON.stringify(minifiedPlants);
                        systemInstruction = "You are Nabatech AI. User's plants: ".concat(contextStr, ". Answer questions using this context.");
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.ai.models.generateContent({
                                model: 'gemini-2.5-flash',
                                contents: message,
                                config: {
                                    systemInstruction: systemInstruction,
                                    responseMimeType: 'application/json',
                                    responseSchema: {
                                        type: genai_1.Type.OBJECT,
                                        properties: {
                                            reply: { type: genai_1.Type.STRING },
                                            detectedPlant: {
                                                type: genai_1.Type.OBJECT,
                                                nullable: true,
                                                properties: {
                                                    name: { type: genai_1.Type.STRING },
                                                    species: { type: genai_1.Type.STRING }
                                                }
                                            }
                                        },
                                        required: ['reply']
                                    }
                                }
                            })];
                    case 3:
                        response = _a.sent();
                        if (!response.text) {
                            throw new Error('No response from AI');
                        }
                        return [2 /*return*/, JSON.parse(response.text)];
                    case 4:
                        err_1 = _a.sent();
                        logger_1.logger.error('Error generating AI response:', err_1);
                        throw new Error('Failed to generate AI response');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    AiOrchestratorService.prototype.analyzeGarden = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var plants, minifiedPlants, contextStr, systemInstruction, response, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getMergedUserPlants(userId)];
                    case 1:
                        plants = _a.sent();
                        minifiedPlants = plants.map(function (p) { return ({
                            name: p.name,
                            stage: p.stage,
                            healthScore: p.healthScore,
                            lastWatered: p.lastWatered
                        }); });
                        contextStr = JSON.stringify(minifiedPlants);
                        systemInstruction = "You are Nabatech AI Garden Manager. Analyze the user's garden and provide a report. Here are the plants: ".concat(contextStr);
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.ai.models.generateContent({
                                model: 'gemini-2.5-flash',
                                contents: 'Generate a garden report.',
                                config: {
                                    systemInstruction: systemInstruction,
                                    responseMimeType: 'application/json',
                                    responseSchema: {
                                        type: genai_1.Type.OBJECT,
                                        properties: {
                                            score: { type: genai_1.Type.INTEGER, description: 'Overall garden score from 0 to 100' },
                                            urgentActions: {
                                                type: genai_1.Type.ARRAY,
                                                items: { type: genai_1.Type.STRING },
                                                description: 'List of urgent actions needed (e.g. "Water the Ficus")'
                                            },
                                            summary: { type: genai_1.Type.STRING, description: 'A short summary of the garden health' }
                                        },
                                        required: ['score', 'urgentActions', 'summary']
                                    }
                                }
                            })];
                    case 3:
                        response = _a.sent();
                        if (!response.text) {
                            throw new Error('No response from AI');
                        }
                        return [2 /*return*/, JSON.parse(response.text)];
                    case 4:
                        err_2 = _a.sent();
                        logger_1.logger.error('Error generating garden analysis:', err_2);
                        throw new Error('Failed to analyze garden');
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    return AiOrchestratorService;
}());
exports.AiOrchestratorService = AiOrchestratorService;
