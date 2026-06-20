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
exports.VoiceService = void 0;
var speech_1 = require("@google-cloud/speech");
var genai_1 = require("@google/genai");
var VoiceCommandRepository_1 = require("../repositories/VoiceCommandRepository");
var CareService_1 = require("./CareService");
var PlantRepository_1 = require("../repositories/PlantRepository");
var voice_command_model_1 = require("../models/voice_command_model");
var care_action_model_1 = require("../models/care_action_model");
var env_1 = require("../config/env");
var logger_1 = require("../utils/logger");
var fs_1 = __importDefault(require("fs"));
var VoiceService = /** @class */ (function () {
    function VoiceService() {
        // Lazy-init: don't create SpeechClient at construction time
        // (requires Google credentials which may not exist in serverless env)
        this.ai = new genai_1.GoogleGenAI({ apiKey: env_1.env.GEMINI_API_KEY || 'placeholder' });
        this.voiceRepo = new VoiceCommandRepository_1.VoiceCommandRepository();
        this.careService = new CareService_1.CareService();
        this.plantRepo = new PlantRepository_1.PlantRepository();
    }
    VoiceService.prototype.processAudio = function (userId, audioFilePath) {
        return __awaiter(this, void 0, void 0, function () {
            var file, audioBytes;
            return __generator(this, function (_a) {
                try {
                    file = fs_1.default.readFileSync(audioFilePath);
                    audioBytes = file.toString('base64');
                    return [2 /*return*/, this.processCommand(audioBytes, userId, 'en-US')];
                }
                catch (err) {
                    logger_1.logger.error('Error processing audio file:', err);
                    throw err;
                }
                return [2 /*return*/];
            });
        });
    };
    VoiceService.prototype.processCommand = function (audioBytes_1, userId_1) {
        return __awaiter(this, arguments, void 0, function (audioBytes, userId, languageCode) {
            var e_1, request, response, transcript, plants, plantsContext, systemInstruction, aiRes, intentData, finalStatus, actionType, voiceCommand, err_1;
            var _a;
            if (languageCode === void 0) { languageCode = 'ar'; }
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _b.trys.push([0, 17, , 19]);
                        if (!!this.speechClient) return [3 /*break*/, 4];
                        _b.label = 1;
                    case 1:
                        _b.trys.push([1, 2, , 4]);
                        this.speechClient = new speech_1.v1.SpeechClient();
                        return [3 /*break*/, 4];
                    case 2:
                        e_1 = _b.sent();
                        logger_1.logger.error('Google Speech client unavailable:', e_1);
                        return [4 /*yield*/, this.voiceRepo.create({
                                user: userId,
                                transcript: '',
                                status: voice_command_model_1.VoiceCommandStatus.FAILED,
                                response: 'Voice service unavailable in this environment'
                            })];
                    case 3: return [2 /*return*/, _b.sent()];
                    case 4:
                        request = {
                            audio: { content: audioBytes },
                            config: {
                                encoding: 'LINEAR16', // Or adjust based on client
                                sampleRateHertz: 16000,
                                languageCode: languageCode,
                            },
                        };
                        return [4 /*yield*/, this.speechClient.recognize(request)];
                    case 5:
                        response = (_b.sent())[0];
                        transcript = ((_a = response.results) === null || _a === void 0 ? void 0 : _a.map(function (result) { var _a, _b; return (_b = (_a = result.alternatives) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.transcript; }).join('\n')) || '';
                        if (!!transcript) return [3 /*break*/, 7];
                        return [4 /*yield*/, this.voiceRepo.create({
                                user: userId,
                                transcript: '',
                                status: voice_command_model_1.VoiceCommandStatus.FAILED,
                                response: 'Could not transcribe audio'
                            })];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [4 /*yield*/, this.plantRepo.findByUserId(userId)];
                    case 8:
                        plants = _b.sent();
                        plantsContext = plants.map(function (p) { return ({ id: p._id, name: p.name }); }).join(', ');
                        systemInstruction = "Extract the intent from the user's voice command.\nUser's plants: ".concat(plantsContext, ".\nMap the intent to one of the following exact strings: WATER_PLANT, PRUNE_PLANT, FERTILIZE_PLANT.\nIf it's an action on a plant, return the intent and the exact plantId. If unknown, return UNKNOWN.");
                        return [4 /*yield*/, this.ai.models.generateContent({
                                model: 'gemini-2.5-flash',
                                contents: transcript,
                                config: {
                                    systemInstruction: systemInstruction,
                                    responseMimeType: 'application/json',
                                    responseSchema: {
                                        type: genai_1.Type.OBJECT,
                                        properties: {
                                            intent: { type: genai_1.Type.STRING },
                                            plantId: { type: genai_1.Type.STRING, nullable: true },
                                            replyMessage: { type: genai_1.Type.STRING }
                                        },
                                        required: ['intent', 'replyMessage']
                                    }
                                }
                            })];
                    case 9:
                        aiRes = _b.sent();
                        if (!aiRes.text)
                            throw new Error('AI failed to process intent');
                        intentData = JSON.parse(aiRes.text);
                        finalStatus = voice_command_model_1.VoiceCommandStatus.SUCCESS;
                        if (!(intentData.intent !== 'UNKNOWN' && intentData.plantId)) return [3 /*break*/, 14];
                        actionType = null;
                        if (intentData.intent === 'WATER_PLANT')
                            actionType = care_action_model_1.CareActionType.WATER;
                        if (intentData.intent === 'PRUNE_PLANT')
                            actionType = care_action_model_1.CareActionType.PRUNE;
                        if (!actionType) return [3 /*break*/, 11];
                        return [4 /*yield*/, this.careService.logAction(intentData.plantId, userId, actionType, new Date(), 'Via Voice Command')];
                    case 10:
                        _b.sent();
                        return [3 /*break*/, 13];
                    case 11:
                        if (!(intentData.intent === 'FERTILIZE_PLANT')) return [3 /*break*/, 13];
                        // Defaulting to ALL_PURPOSE, you can get specific in Gemini
                        return [4 /*yield*/, this.careService.logFertilizer(intentData.plantId, userId, 'ALL_PURPOSE', '1 dose', new Date())];
                    case 12:
                        // Defaulting to ALL_PURPOSE, you can get specific in Gemini
                        _b.sent();
                        _b.label = 13;
                    case 13: return [3 /*break*/, 15];
                    case 14:
                        finalStatus = voice_command_model_1.VoiceCommandStatus.UNKNOWN_INTENT;
                        _b.label = 15;
                    case 15: return [4 /*yield*/, this.voiceRepo.create({
                            user: userId,
                            transcript: transcript,
                            intent: intentData.intent,
                            status: finalStatus,
                            response: intentData.replyMessage
                        })];
                    case 16:
                        voiceCommand = _b.sent();
                        return [2 /*return*/, voiceCommand];
                    case 17:
                        err_1 = _b.sent();
                        logger_1.logger.error('Error processing voice command:', err_1);
                        return [4 /*yield*/, this.voiceRepo.create({
                                user: userId,
                                transcript: 'Error processing',
                                status: voice_command_model_1.VoiceCommandStatus.FAILED,
                                response: 'Internal error processing audio'
                            })];
                    case 18: return [2 /*return*/, _b.sent()];
                    case 19: return [2 /*return*/];
                }
            });
        });
    };
    return VoiceService;
}());
exports.VoiceService = VoiceService;
