import { Request, Response } from "express";
import { orchestrateAssistantRequest } from "../services/ai/ai_orchestrator_service";
import { NextFunction } from "express";
import AiCallLog from "../models/ai_call_log_model";
import { sanitizeErrorMessage } from "../services/ai/ai_errors";
import cloudinary from "../config/cloudinary";
import DiagnosisHistory from "../models/diagnosis_history_model";
import Message from "../models/message_model";
import { DiseaseKnowledgeRecord } from "../models/disease_knowledge_record_model";
import { validateHistory, validateQuestion, validateTopK } from "../validation/diagnosis_schemas";
import crypto from "crypto";

export const postTestAssistantRequest = async (req: Request, res: Response) => {
  try {
    const question = req.body?.question || req.body?.text || "";
    let uploadedImagePublicId: string | null = null;
    let imageUrl = req.body?.imageUrl || "";

    if (req.file) {
      const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: "assistant_images" }, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }).end(req.file!.buffer);
      });
      imageUrl = uploadResult.secure_url;
      uploadedImagePublicId = uploadResult.public_id;
    }

    const { orchestrateAssistantRequest } = await import("../services/ai/ai_orchestrator_service");
    const result = await orchestrateAssistantRequest({
      userId: "test-bypass-id",
      requestId: "test-req-id",
      question,
      fileBuffer: req.file?.buffer,
      originalName: req.file?.originalname,
      history: [],
      topK: 3,
      language: "en"
    });

    return res.status(200).json({ success: true, ...result, imageUrl: imageUrl || undefined });
  } catch (error: any) {
    console.error("Test Assistant request failed:", error.message);
    return res.status(502).json({ success: false, message: error.message });
  }
};

const parseHistory = (raw: unknown): Array<{ role: string; content: string }> => {
  if (Array.isArray(raw)) return raw as Array<{ role: string; content: string }>;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as Array<{ role: string; content: string }>) : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const postAssistantRequest = async (req: Request, res: Response) => {
  let uploadedImagePublicId: string | null = null;
  try {
    // ── PHASE 4: Backend request diagnostic logging ──────────────────────────
    console.log('═══════════════ BACKEND RECEIVED REQUEST ═════════════════');
    console.log('[DIAG] Timestamp   :', new Date().toISOString());
    console.log('[DIAG] Method      :', req.method);
    console.log('[DIAG] Path        :', req.path);
    console.log('[DIAG] Auth header :', req.headers.authorization ? `Bearer ${req.headers.authorization.split(' ')[1]?.substring(0, 20)}...` : 'MISSING');
    console.log('[DIAG] Content-Type:', req.headers['content-type']);
    console.log('[DIAG] Accept      :', req.headers.accept);
    console.log('[DIAG] User-Agent  :', req.headers['user-agent']);
    console.log('[DIAG] User ID     :', (req as any)?.user?.id ?? 'NOT SET — auth may have failed');
    console.log('[DIAG] File present:', req.file ? `YES (${req.file.originalname}, ${(req.file.size / 1024).toFixed(1)} KB, ${req.file.mimetype})` : 'NO');
    console.log('[DIAG] Body.text   :', (req.body?.text || req.body?.question || '').toString().substring(0, 100));
    console.log('[DIAG] History len :', Array.isArray(req.body?.history) ? req.body.history.length : (typeof req.body?.history === 'string' ? 'JSON string' : 'missing'));
    console.log('[DIAG] top_k       :', req.body?.top_k ?? req.body?.topK ?? 'not set');
    console.log('══════════════════════════════════════════════════════════');
    // ─────────────────────────────────────────────────────────────────────────

    const text = (req.body?.text || req.body?.question || "").toString().trim();
    const history = parseHistory(req.body?.history);
    const topK = Number(req.body?.top_k || req.body?.topK) || undefined;
    const clientOperationId = req.body?.clientOperationId;
    const file = req.file;
    const language = (req.headers["accept-language"] || "en").toString().split(",")[0].trim().split("-")[0];

    if (!file && !text) {
      return res.status(400).json({ success: false, message: "Either file or text/question is required" });
    }

    if (!validateHistory(history)) {
      return res.status(400).json({ success: false, message: "Invalid history format or length" });
    }
    if (!validateQuestion(text)) {
      return res.status(400).json({ success: false, message: "Question exceeds maximum length" });
    }
    if (!validateTopK(topK)) {
      return res.status(400).json({ success: false, message: "Invalid top_k parameter" });
    }

    const userId = (req as any)?.user?.id;
    const requestId = crypto.randomUUID();

    if (clientOperationId) {
      const existing = await DiagnosisHistory.findOne({ user: userId, clientOperationId }).lean();
      if (existing) {
         return res.status(200).json({ 
           success: true, 
           mode: existing.imageUrl ? "image_chat" : "chat", 
           message: "Retrieved existing record",
           imageUrl: existing.imageUrl,
           diagnosis: {
             prediction: existing.diseaseNameEn,
             confidence: existing.confidence,
             candidates: existing.candidates,
             provider: existing.provider
           }
         });
      }
    }

    const isSSE = req.headers.accept === "text/event-stream";
    if (isSSE) {
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();
    }

    // 1. Start Image Upload (if any)
    let uploadPromise: Promise<{ secure_url: string; public_id: string }> | null = null;
    if (file) {
      uploadPromise = new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream({ folder: "diagnoses" }, (error, uploadResult) => {
          if (error) return reject(error);
          resolve({ secure_url: uploadResult!.secure_url, public_id: uploadResult!.public_id });
        });
        stream.end(file.buffer);
      }).catch(error => {
        console.warn("Assistant image upload skipped:", sanitizeErrorMessage(error));
        return { secure_url: "", public_id: "" };
      });
    }

    // 2. Run inference in parallel
    const inferencePromise = orchestrateAssistantRequest({
      userId,
      fileBuffer: file?.buffer,
      originalName: file?.originalname,
      question: text,
      history,
      topK,
      language,
      onProgress: (phase: string) => {
        if (isSSE) {
          res.write(`data: ${JSON.stringify({ type: "progress", phase })}\n\n`);
        }
      }
    });

    // Wait for both to complete
    const [result, uploadResult] = await Promise.all([inferencePromise, uploadPromise]);
    
    let imageUrl = uploadResult?.secure_url || "";
    uploadedImagePublicId = uploadResult?.public_id || null;

    if (file) {
      if (imageUrl) {
        if ((result as any)?.diagnosis?.prediction) {
          try {
            const prediction = (result as any).diagnosis.prediction;
          const kbRecord = await DiseaseKnowledgeRecord.findOne({
            $or: [
              { diseaseNameEn: prediction },
              { diseaseNameEn: prediction.replace(/_/g, " ") }
            ]
          }).lean();
          const confidence = typeof (result as any).diagnosis.confidence === "number" ? (result as any).diagnosis.confidence : 0.5;
          const severity = kbRecord?.severity || (confidence > 0.6 ? "medium" : "low");
          const diseaseNameAr = kbRecord?.diseaseNameAr || prediction;

          await DiagnosisHistory.create({
            user: userId,
            clientOperationId,
            imageUrl,
            imagePublicId: uploadedImagePublicId,
            diseaseNameAr,
            diseaseNameEn: prediction,
            confidence,
            severity,
            isOffline: false,
            modelId: (result as any).diagnosis.provider || "unknown",
            provider: result.provider,
            source: result.source,
            sourceIds: result.providerChain,
            uncertain: Boolean((result as any).lowConfidenceWarning),
            needsNewImage: (result as any).needsNewImage,
            advice: kbRecord?.advice || result.message,
            llmResponse: result.message,
            cnnResult: JSON.stringify((result as any).diagnosis),
            ragContext: result.ragContext ? [result.ragContext] : [],
          });
        } catch (error) {
          console.warn("Assistant diagnosis history save failed:", sanitizeErrorMessage(error));
          if (uploadedImagePublicId) {
            try {
              await cloudinary.uploader.destroy(uploadedImagePublicId);
              imageUrl = "";
              uploadedImagePublicId = null;
            } catch (delErr) {
               console.error("Failed to cleanup Cloudinary on history save error:", sanitizeErrorMessage(delErr));
            }
          }
        }
        }

        // ✅ FIX #3: Persist image conversation to the Message collection so it
        // appears in /api/chat/history, recent chats, and history reload.
        // Image chats use a dedicated conversationId bucket for easy filtering.
        const imageConversationId = `conv-image-${userId}`;
        const userQuestion = text || "Please analyze this plant image.";

        try {
          // User message — includes image URL and diagnosis result
          await Message.create({
            user: userId,
            sender: "user",
            role: "user",
            text: userQuestion,
            conversationId: imageConversationId,
            requestId,
            clientOperationId,
            status: "sent",
            imageUrl, // ✅ image URL stored on the user message
            diagnosisResult: (result as any).diagnosis
              ? {
                  prediction: (result as any).diagnosis.prediction,
                  confidence: (result as any).diagnosis.confidence,
                  candidates: (result as any).diagnosis.candidates || [],
                }
              : undefined,
          });

          // Assistant message — stores the LLM response for this image
          if (result.message) {
            await Message.create({
              user: userId,
              sender: "llm",
              role: "assistant",
              text: result.message,
              conversationId: imageConversationId,
              requestId,
              status: "sent",
              provider: result.provider,
              source: result.source,
              sourceIds: result.providerChain,
            });
          }
        } catch (msgError) {
          // Message persistence failure is non-fatal — diagnosis was already saved
          console.warn("Image chat message persistence failed:", sanitizeErrorMessage(msgError));
        }
      }
    }

    const finalResponse: any = { success: true, ...result, imageUrl: imageUrl || undefined, uncertain: Boolean((result as any).lowConfidenceWarning) };
    
    // Clean up internal AI implementation details from the client response
    delete finalResponse.ragContext;
    delete finalResponse.communityContext;
    delete finalResponse.providerChain;
    delete finalResponse.lowConfidenceWarning;
    delete finalResponse.provider;
    delete finalResponse.source;
    delete finalResponse.toolCalls;
    
    if (finalResponse.diagnosis) {
       // Only expose the condition to the frontend
       finalResponse.diagnosis = {
         prediction: finalResponse.diagnosis.prediction,
       };
    }

    if (isSSE) {
      // ── PHASE 4: Log final response summary ─────────────────────────────
      console.log('[DIAG] Sending SSE result. diagnosis:', JSON.stringify(finalResponse.diagnosis), '| message length:', finalResponse.message?.length ?? 0);
      console.log('══════════════ BACKEND RESPONSE SENT (SSE) ═══════════════');
      res.write(`data: ${JSON.stringify({ type: "result", data: finalResponse })}\n\n`);
      return res.end();
    }
    console.log('[DIAG] Sending JSON result. diagnosis:', JSON.stringify(finalResponse.diagnosis), '| message length:', finalResponse.message?.length ?? 0);
    return res.status(200).json(finalResponse);
  } catch (error) {
    const errMsg = sanitizeErrorMessage(error);
    console.error("Assistant pipeline failed:", errMsg);
    if (uploadedImagePublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedImagePublicId);
      } catch (delErr) {
        console.error("Failed to cleanup Cloudinary on assistant request error:", sanitizeErrorMessage(delErr));
      }
    }
    if (req.headers.accept === "text/event-stream") {
      // ── PHASE 4: Send the real error in SSE so Flutter can display it ─────
      res.write(`data: ${JSON.stringify({ type: "error", message: `Assistant request failed: ${errMsg}` })}\n\n`);
      return res.end();
    }
    return res.status(502).json({ success: false, message: `Assistant request failed: ${errMsg}` });
  }
};

export const postGenerateDraft = async (req: Request, res: Response) => {
  try {
    const text = (req.body?.text || req.body?.question || "").toString().trim();
    const history = parseHistory(req.body?.history);
    const diagnosisResult = req.body?.diagnosisResult;

    if (!text && history.length === 0) {
      return res.status(400).json({ success: false, message: "History or question is required" });
    }

    const { generateCommunityDraft } = await import("../services/ai/draft_generator");
    const draft = await generateCommunityDraft({
      userQuestion: text,
      history,
      diagnosisResult,
    });

    return res.status(200).json({ success: true, draft });
  } catch (error) {
    console.error("Draft generation failed:", sanitizeErrorMessage(error));
    return res.status(500).json({ success: false, message: "Draft generation failed" });
  }
};

export const postQueryLibrary = async (req: Request, res: Response) => {
  try {
    const query = (req.body?.query || req.query?.query || "").toString().trim();
    if (!query) {
      return res.status(400).json({ success: false, message: "Query is required" });
    }
    
    const { PlantEmbeddingsService } = await import("../services/plant_embeddings_service");
    const plants = await PlantEmbeddingsService.searchSimilarPlants(query, 5);
    
    return res.status(200).json({ success: true, data: plants });
  } catch (error) {
    console.error("Library query failed:", sanitizeErrorMessage(error));
    return res.status(500).json({ success: false, message: "Library query failed" });
  }
};

const greetingCache = new Map<string, { time: number, data: any }>();

export const getGreeting = async (req: Request, res: Response) => {
  try {
    const userId = (req as any)?.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });

    const now = Date.now();
    const cached = greetingCache.get(userId);
    // Cache for 24 hours
    if (cached && now - cached.time < 24 * 3600 * 1000) {
      return res.status(200).json({ success: true, greeting: cached.data });
    }

    const PlantModel = (await import("../models/plant_model")).default;
    const plants = await PlantModel.find({ user: userId }).lean();
    let plantStr = plants.length > 0 ? plants.map((p: any) => p.name || p.species).join(', ') : "no plants yet";
    
    const { getAiSettings } = await import("../services/ai/ai_config_service");
    const { askLlm } = await import("../services/ai/llm_provider");
    
    const settings = await getAiSettings();
    const prompt = `You are a smart AI garden assistant named Nabatech. Generate a dynamic 2-line greeting for the user. 
They currently have: ${plantStr}. 
Pretend you know the weather is sunny. Suggest a brief care tip.
Maximum 2 short lines. Output STRICTLY as a JSON object with this exact structure, nothing else:
{
  "arabicGreeting": "...",
  "englishGreeting": "..."
}`;
    
    const llmRes = await askLlm(settings, prompt, "llm", []);
    
    // Strip <think> tags completely
    let rawContent = llmRes.message.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
    
    let parsedGreeting: any;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[0] : rawContent;
      parsedGreeting = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse greeting JSON, using fallback. Raw:", rawContent);
      parsedGreeting = {
        arabicGreeting: "🌱 صباح الخير! لا تنس متابعة نباتاتك اليوم.",
        englishGreeting: "🌱 Good morning! Don't forget to check on your plants today."
      };
    }
    
    parsedGreeting.generatedDate = new Date().toISOString().split('T')[0];

    greetingCache.set(userId, { time: now, data: parsedGreeting });

    return res.status(200).json({ success: true, greeting: parsedGreeting });
  } catch (error) {
    console.error("Greeting failed:", sanitizeErrorMessage(error));
    return res.status(500).json({ success: false, message: "Greeting failed" });
  }
};


