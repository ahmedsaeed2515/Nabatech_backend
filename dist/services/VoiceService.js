"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VoiceService = void 0;
const speech_1 = require("@google-cloud/speech");
const genai_1 = require("@google/genai");
const VoiceCommandRepository_1 = require("../repositories/VoiceCommandRepository");
const CareService_1 = require("./CareService");
const PlantRepository_1 = require("../repositories/PlantRepository");
const voice_command_model_1 = require("../models/voice_command_model");
const care_action_model_1 = require("../models/care_action_model");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
const fs_1 = __importDefault(require("fs"));
class VoiceService {
    constructor() {
        // Lazy-init: don't create SpeechClient at construction time
        // (requires Google credentials which may not exist in serverless env)
        this.ai = new genai_1.GoogleGenAI({ apiKey: env_1.env.GEMINI_API_KEY || 'placeholder' });
        this.voiceRepo = new VoiceCommandRepository_1.VoiceCommandRepository();
        this.careService = new CareService_1.CareService();
        this.plantRepo = new PlantRepository_1.PlantRepository();
    }
    async processAudio(userId, audioFilePath) {
        try {
            const file = fs_1.default.readFileSync(audioFilePath);
            const audioBytes = file.toString('base64');
            return this.processCommand(audioBytes, userId, 'en-US');
        }
        catch (err) {
            logger_1.logger.error('Error processing audio file:', err);
            throw err;
        }
    }
    async processCommand(audioBytes, userId, languageCode = 'ar') {
        try {
            if (!this.speechClient) {
                try {
                    this.speechClient = new speech_1.v1.SpeechClient();
                }
                catch (e) {
                    logger_1.logger.error('Google Speech client unavailable:', e);
                    return await this.voiceRepo.create({
                        user: userId,
                        transcript: '',
                        status: voice_command_model_1.VoiceCommandStatus.FAILED,
                        response: 'Voice service unavailable in this environment'
                    });
                }
            }
            const request = {
                audio: { content: audioBytes },
                config: {
                    encoding: 'LINEAR16', // Or adjust based on client
                    sampleRateHertz: 16000,
                    languageCode: languageCode,
                },
            };
            const [response] = await this.speechClient.recognize(request);
            const transcript = response.results
                ?.map((result) => result.alternatives?.[0]?.transcript)
                .join('\n') || '';
            if (!transcript) {
                return await this.voiceRepo.create({
                    user: userId,
                    transcript: '',
                    status: voice_command_model_1.VoiceCommandStatus.FAILED,
                    response: 'Could not transcribe audio'
                });
            }
            // 2. Extract intent using Gemini
            const plants = await this.plantRepo.findByUserId(userId);
            const plantsContext = plants.map(p => ({ id: p._id, name: p.name })).join(', ');
            const systemInstruction = `Extract the intent from the user's voice command.
User's plants: ${plantsContext}.
Map the intent to one of the following exact strings: WATER_PLANT, PRUNE_PLANT, FERTILIZE_PLANT.
If it's an action on a plant, return the intent and the exact plantId. If unknown, return UNKNOWN.`;
            const aiRes = await this.ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: transcript,
                config: {
                    systemInstruction,
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
            });
            if (!aiRes.text)
                throw new Error('AI failed to process intent');
            const intentData = JSON.parse(aiRes.text);
            // 3. Execute Action
            let finalStatus = voice_command_model_1.VoiceCommandStatus.SUCCESS;
            if (intentData.intent !== 'UNKNOWN' && intentData.plantId) {
                let actionType = null;
                if (intentData.intent === 'WATER_PLANT')
                    actionType = care_action_model_1.CareActionType.WATER;
                if (intentData.intent === 'PRUNE_PLANT')
                    actionType = care_action_model_1.CareActionType.PRUNE;
                if (actionType) {
                    await this.careService.logAction(intentData.plantId, userId, actionType, new Date(), 'Via Voice Command');
                }
                else if (intentData.intent === 'FERTILIZE_PLANT') {
                    // Defaulting to ALL_PURPOSE, you can get specific in Gemini
                    await this.careService.logFertilizer(intentData.plantId, userId, 'ALL_PURPOSE', '1 dose', new Date());
                }
            }
            else {
                finalStatus = voice_command_model_1.VoiceCommandStatus.UNKNOWN_INTENT;
            }
            // 4. Save VoiceCommand
            const voiceCommand = await this.voiceRepo.create({
                user: userId,
                transcript,
                intent: intentData.intent,
                status: finalStatus,
                response: intentData.replyMessage
            });
            return voiceCommand;
        }
        catch (err) {
            logger_1.logger.error('Error processing voice command:', err);
            return await this.voiceRepo.create({
                user: userId,
                transcript: 'Error processing',
                status: voice_command_model_1.VoiceCommandStatus.FAILED,
                response: 'Internal error processing audio'
            });
        }
    }
}
exports.VoiceService = VoiceService;
