import { Request, Response } from "express";
import { orchestrateAssistantRequest } from "../services/ai/ai_orchestrator_service";
import { sanitizeErrorMessage } from "../services/ai/ai_errors";
import cloudinary from "../config/cloudinary";
import DiagnosisHistory from "../models/diagnosis_history_model";
import { translateToAr, estimateSeverity } from "./diagnosis_controller";
import { validateHistory, validateQuestion, validateTopK } from "../validation/diagnosis_schemas";

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

    if (clientOperationId) {
      const existing = await DiagnosisHistory.findOne({ user: userId, clientOperationId });
      if (existing) {
         // Return existing history record if clientOperationId matches
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

    // 1. Run inference
    const result = await orchestrateAssistantRequest({
      userId,
      fileBuffer: file?.buffer,
      originalName: file?.originalname,
      question: text,
      history,
      topK,
    });

    let imageUrl = "";
    if (file && result?.diagnosis?.prediction) {
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
        try {
          const confidence = typeof result.diagnosis.confidence === "number" ? result.diagnosis.confidence : 0.5;
          const severity = estimateSeverity(confidence, result.diagnosis.prediction);
          await DiagnosisHistory.create({
            user: userId,
            clientOperationId,
            imageUrl,
            imagePublicId: uploadedImagePublicId,
            diseaseNameAr: translateToAr(result.diagnosis.prediction),
            diseaseNameEn: result.diagnosis.prediction,
            confidence,
            severity,
            isOffline: false,
            modelId: result.diagnosis.provider || "unknown",
            provider: result.provider,
            source: result.source,
            sourceIds: result.providerChain,
            uncertain: Boolean(result.lowConfidenceWarning),
            needsNewImage: result.needsNewImage,
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
    }

    return res.status(200).json({ success: true, ...result, imageUrl: imageUrl || undefined, uncertain: Boolean(result.lowConfidenceWarning) });
  } catch (error) {
    console.error("Assistant pipeline failed:", sanitizeErrorMessage(error));
    if (uploadedImagePublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedImagePublicId);
      } catch (delErr) {
        console.error("Failed to cleanup Cloudinary on assistant request error:", sanitizeErrorMessage(delErr));
      }
    }
    return res.status(502).json({ success: false, message: "Assistant request failed" });
  }
};
