import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../config/env';
import Ticket from '../models/ticket_model';
import { logger } from '../utils/logger';

export class AiSupportService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  async analyzeTicket(subject: string, message: string, email: string) {
    try {
      // 1. Check for potential duplicate tickets in past 48 hours
      const timeThreshold = new Date();
      timeThreshold.setHours(timeThreshold.getHours() - 48);

      const recentTickets = await Ticket.find({
        email,
        createdAt: { $gte: timeThreshold }
      }).limit(5);

      let isDuplicate = false;
      let duplicateOfId: any = undefined;

      if (recentTickets.length > 0) {
        // Run AI comparison to see if it is a duplicate
        const recentStr = recentTickets.map((t, idx) => `[Ticket ${idx + 1} ID: ${t._id}] Subject: ${t.subject} | Message: ${t.message}`).join('\n');
        const comparePrompt = `Compare the new ticket with the recent tickets from the same sender to see if they are duplicates (asking about the exact same issue).
Recent Tickets:
${recentStr}

New Ticket:
Subject: ${subject}
Message: ${message}

If the new ticket is a duplicate of one of the recent tickets, return JSON: {"isDuplicate": true, "duplicateOfId": "Insert duplicate ticket ID here"}. Otherwise return {"isDuplicate": false}.`;

        const dupRes = await this.ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: comparePrompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                isDuplicate: { type: Type.BOOLEAN },
                duplicateOfId: { type: Type.STRING, nullable: true }
              },
              required: ['isDuplicate']
            }
          }
        });

        if (dupRes.text) {
          const parsed = JSON.parse(dupRes.text);
          if (parsed.isDuplicate && parsed.duplicateOfId) {
            isDuplicate = true;
            // Validate if the ID is a valid ObjectId
            if (parsed.duplicateOfId.match(/^[0-9a-fA-F]{24}$/)) {
              duplicateOfId = parsed.duplicateOfId;
            } else {
              duplicateOfId = recentTickets[0]._id;
            }
          }
        }
      }

      // 2. Perform main classification, sentiment, priority, suggestedReply
      const analysisPrompt = `Analyze the following support ticket and classify the category, detect priority, analyze sentiment, and generate a polite, helpful suggested reply as support staff.
Subject: ${subject}
Message: ${message}`;

      const res = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: analysisPrompt,
        config: {
          systemInstruction: 'You are Nabatech AI Support Assistant. Classify the ticket category (technical, billing, general, feedback), prioritize (low, medium, high, urgent) based on user frustration/urgency, analyze sentiment (positive, neutral, negative), and compose a suggested response.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING, enum: ['technical', 'billing', 'general', 'feedback'] },
              priority: { type: Type.STRING, enum: ['low', 'medium', 'high', 'urgent'] },
              sentiment: { type: Type.STRING, enum: ['positive', 'neutral', 'negative'] },
              suggestedReply: { type: Type.STRING }
            },
            required: ['category', 'priority', 'sentiment', 'suggestedReply']
          }
        }
      });

      if (!res.text) {
        throw new Error('AI analysis returned empty');
      }

      const analysis = JSON.parse(res.text);

      return {
        category: analysis.category,
        priority: analysis.priority,
        sentiment: analysis.sentiment,
        suggestedReply: analysis.suggestedReply,
        isDuplicate,
        duplicateOf: duplicateOfId
      };

    } catch (err) {
      logger.error('Error in AiSupportService analyzeTicket:', err);
      // Fallbacks
      return {
        category: 'general',
        priority: 'medium',
        sentiment: 'neutral',
        suggestedReply: 'Thank you for contacting Nabatech support. An agent will review your ticket shortly.',
        isDuplicate: false,
        duplicateOf: undefined
      };
    }
  }
}
