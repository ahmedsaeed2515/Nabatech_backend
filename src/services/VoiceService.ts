import { v1 } from '@google-cloud/speech';
import { GoogleGenAI, Type } from '@google/genai';
import { VoiceCommandRepository } from '../repositories/VoiceCommandRepository';
import { CareService } from './CareService';
import { PlantRepository } from '../repositories/PlantRepository';
import { VoiceCommandStatus } from '../models/voice_command_model';
import { CareActionType } from '../models/care_action_model';
import { env } from '../config/env';
import { logger } from '../utils/logger';
import fs from 'fs';

export class VoiceService {
  private speechClient: v1.SpeechClient;
  private ai: GoogleGenAI;
  private voiceRepo: VoiceCommandRepository;
  private careService: CareService;
  private plantRepo: PlantRepository;

  constructor() {
    this.speechClient = new v1.SpeechClient();
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    this.voiceRepo = new VoiceCommandRepository();
    this.careService = new CareService();
    this.plantRepo = new PlantRepository();
  }

  async processAudio(userId: string, audioFilePath: string) {
    try {
      // 1. Transcribe audio
      const file = fs.readFileSync(audioFilePath);
      const audioBytes = file.toString('base64');

      const request = {
        audio: { content: audioBytes },
        config: {
          encoding: 'LINEAR16' as const, // Or adjust based on client
          sampleRateHertz: 16000,
          languageCode: 'en-US',
        },
      };

      const [response] = await this.speechClient.recognize(request);
      const transcript = response.results
        ?.map((result: any) => result.alternatives?.[0]?.transcript)
        .join('\n') || '';

      if (!transcript) {
        return await this.voiceRepo.create({
          user: userId as any,
          transcript: '',
          status: VoiceCommandStatus.FAILED,
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
            type: Type.OBJECT,
            properties: {
              intent: { type: Type.STRING },
              plantId: { type: Type.STRING, nullable: true },
              replyMessage: { type: Type.STRING }
            },
            required: ['intent', 'replyMessage']
          }
        }
      });

      if (!aiRes.text) throw new Error('AI failed to process intent');
      const intentData = JSON.parse(aiRes.text);

      // 3. Execute Action
      let finalStatus = VoiceCommandStatus.SUCCESS;
      if (intentData.intent !== 'UNKNOWN' && intentData.plantId) {
        let actionType: CareActionType | null = null;
        if (intentData.intent === 'WATER_PLANT') actionType = CareActionType.WATER;
        if (intentData.intent === 'PRUNE_PLANT') actionType = CareActionType.PRUNE;

        if (actionType) {
          await this.careService.logAction(intentData.plantId, userId, actionType, new Date(), 'Via Voice Command');
        } else if (intentData.intent === 'FERTILIZE_PLANT') {
          // Defaulting to ALL_PURPOSE, you can get specific in Gemini
          await this.careService.logFertilizer(intentData.plantId, userId, 'ALL_PURPOSE' as any, '1 dose', new Date());
        }
      } else {
        finalStatus = VoiceCommandStatus.UNKNOWN_INTENT;
      }

      // 4. Save VoiceCommand
      const voiceCommand = await this.voiceRepo.create({
        user: userId as any,
        transcript,
        intent: intentData.intent,
        status: finalStatus,
        response: intentData.replyMessage
      });

      return voiceCommand;
    } catch (err) {
      logger.error('Error processing voice command:', err);
      return await this.voiceRepo.create({
        user: userId as any,
        transcript: 'Error processing',
        status: VoiceCommandStatus.FAILED,
        response: 'Internal error processing audio'
      });
    }
  }
}
