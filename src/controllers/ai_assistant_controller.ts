import { Request, Response } from "express";
import { orchestrateAssistantRequest } from "../services/ai/ai_orchestrator_service";
import { NextFunction } from "express";
import { AiCallLog } from "../models/ai_call_log_model";
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
      imageUrl,
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
      const existing = await DiagnosisHistory.findOne({ user: userId, clientOperationId });
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

    // 1. Run inference
    const result = await orchestrateAssistantRequest({
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

    let imageUrl = "";
    if (file) {
      try {
        const uploadResult = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: "diagnoses" }, (error, uploadResult) => {
            if (error) return reject(error);
            resolve({ secure_url: uploadResult!.secure_url, public_id: uploadResult!.public_id });
          });
          stream.end(file.buffer);
        });
        imageUrl = uploadResult.secure_url;
        uploadedImagePublicId = uploadResult.public_id;
      } catch (error) {
        console.warn("Assistant image upload skipped:", sanitizeErrorMessage(error));
      }

      if (imageUrl) {
        if ((result as any)?.diagnosis?.prediction) {
          try {
            const prediction = (result as any).diagnosis.prediction;
          const kbRecord = await DiseaseKnowledgeRecord.findOne({
            $or: [
              { diseaseNameEn: prediction },
              { diseaseNameEn: prediction.replace(/_/g, " ") }
            ]
          });
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

    const finalResponse = { success: true, ...result, imageUrl: imageUrl || undefined, uncertain: Boolean((result as any).lowConfidenceWarning) };
    if (isSSE) {
      res.write(`data: ${JSON.stringify({ type: "result", data: finalResponse })}\n\n`);
      return res.end();
    }
    return res.status(200).json(finalResponse);
  } catch (error) {
    console.error("Assistant pipeline failed:", sanitizeErrorMessage(error));
    if (uploadedImagePublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedImagePublicId);
      } catch (delErr) {
        console.error("Failed to cleanup Cloudinary on assistant request error:", sanitizeErrorMessage(delErr));
      }
    }
    if (req.headers.accept === "text/event-stream") {
      res.write(`data: ${JSON.stringify({ type: "error", message: "Assistant request failed" })}\n\n`);
      return res.end();
    }
    return res.status(502).json({ success: false, message: "Assistant request failed" });
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
