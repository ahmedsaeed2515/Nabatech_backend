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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiSupportService = void 0;
var genai_1 = require("@google/genai");
var env_1 = require("../config/env");
var ticket_model_1 = __importDefault(require("../models/ticket_model"));
var logger_1 = require("../utils/logger");
var AiSupportService = /** @class */ (function () {
    function AiSupportService() {
        this.ai = new genai_1.GoogleGenAI({ apiKey: env_1.env.GEMINI_API_KEY });
    }
    AiSupportService.prototype.analyzeTicket = function (subject, message, email) {
        return __awaiter(this, void 0, void 0, function () {
            var timeThreshold, recentTickets, isDuplicate, duplicateOfId, recentStr, comparePrompt, dupRes, parsed, analysisPrompt, res, analysis, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 5, , 6]);
                        timeThreshold = new Date();
                        timeThreshold.setHours(timeThreshold.getHours() - 48);
                        return [4 /*yield*/, ticket_model_1.default.find({
                                email: email,
                                createdAt: { $gte: timeThreshold }
                            }).limit(5)];
                    case 1:
                        recentTickets = _a.sent();
                        isDuplicate = false;
                        duplicateOfId = undefined;
                        if (!(recentTickets.length > 0)) return [3 /*break*/, 3];
                        recentStr = recentTickets.map(function (t, idx) { return "[Ticket ".concat(idx + 1, " ID: ").concat(t._id, "] Subject: ").concat(t.subject, " | Message: ").concat(t.message); }).join('\n');
                        comparePrompt = "Compare the new ticket with the recent tickets from the same sender to see if they are duplicates (asking about the exact same issue).\nRecent Tickets:\n".concat(recentStr, "\n\nNew Ticket:\nSubject: ").concat(subject, "\nMessage: ").concat(message, "\n\nIf the new ticket is a duplicate of one of the recent tickets, return JSON: {\"isDuplicate\": true, \"duplicateOfId\": \"Insert duplicate ticket ID here\"}. Otherwise return {\"isDuplicate\": false}.");
                        return [4 /*yield*/, this.ai.models.generateContent({
                                model: 'gemini-2.5-flash',
                                contents: comparePrompt,
                                config: {
                                    responseMimeType: 'application/json',
                                    responseSchema: {
                                        type: genai_1.Type.OBJECT,
                                        properties: {
                                            isDuplicate: { type: genai_1.Type.BOOLEAN },
                                            duplicateOfId: { type: genai_1.Type.STRING, nullable: true }
                                        },
                                        required: ['isDuplicate']
                                    }
                                }
                            })];
                    case 2:
                        dupRes = _a.sent();
                        if (dupRes.text) {
                            parsed = JSON.parse(dupRes.text);
                            if (parsed.isDuplicate && parsed.duplicateOfId) {
                                isDuplicate = true;
                                // Validate if the ID is a valid ObjectId
                                if (parsed.duplicateOfId.match(/^[0-9a-fA-F]{24}$/)) {
                                    duplicateOfId = parsed.duplicateOfId;
                                }
                                else {
                                    duplicateOfId = recentTickets[0]._id;
                                }
                            }
                        }
                        _a.label = 3;
                    case 3:
                        analysisPrompt = "Analyze the following support ticket and classify the category, detect priority, analyze sentiment, and generate a polite, helpful suggested reply as support staff.\nSubject: ".concat(subject, "\nMessage: ").concat(message);
                        return [4 /*yield*/, this.ai.models.generateContent({
                                model: 'gemini-2.5-flash',
                                contents: analysisPrompt,
                                config: {
                                    systemInstruction: 'You are Nabatech AI Support Assistant. Classify the ticket category (technical, billing, general, feedback), prioritize (low, medium, high, urgent) based on user frustration/urgency, analyze sentiment (positive, neutral, negative), and compose a suggested response.',
                                    responseMimeType: 'application/json',
                                    responseSchema: {
                                        type: genai_1.Type.OBJECT,
                                        properties: {
                                            category: { type: genai_1.Type.STRING, enum: ['technical', 'billing', 'general', 'feedback'] },
                                            priority: { type: genai_1.Type.STRING, enum: ['low', 'medium', 'high', 'urgent'] },
                                            sentiment: { type: genai_1.Type.STRING, enum: ['positive', 'neutral', 'negative'] },
                                            suggestedReply: { type: genai_1.Type.STRING }
                                        },
                                        required: ['category', 'priority', 'sentiment', 'suggestedReply']
                                    }
                                }
                            })];
                    case 4:
                        res = _a.sent();
                        if (!res.text) {
                            throw new Error('AI analysis returned empty');
                        }
                        analysis = JSON.parse(res.text);
                        return [2 /*return*/, {
                                category: analysis.category,
                                priority: analysis.priority,
                                sentiment: analysis.sentiment,
                                suggestedReply: analysis.suggestedReply,
                                isDuplicate: isDuplicate,
                                duplicateOf: duplicateOfId
                            }];
                    case 5:
                        err_1 = _a.sent();
                        logger_1.logger.error('Error in AiSupportService analyzeTicket:', err_1);
                        // Fallbacks
                        return [2 /*return*/, {
                                category: 'general',
                                priority: 'medium',
                                sentiment: 'neutral',
                                suggestedReply: 'Thank you for contacting Nabatech support. An agent will review your ticket shortly.',
                                isDuplicate: false,
                                duplicateOf: undefined
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    return AiSupportService;
}());
exports.AiSupportService = AiSupportService;
