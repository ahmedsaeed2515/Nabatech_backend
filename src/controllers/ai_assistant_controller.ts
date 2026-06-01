import { Request, Response } from "express";
import { orchestrateAssistantRequest } from "../services/ai/ai_orchestrator_service";
import { sanitizeErrorMessage } from "../services/ai/ai_errors";
import cloudinary from "../config/cloudinary";
import DiagnosisHistory from "../models/diagnosis_history_model";

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
  try {
    const text = (req.body?.text || req.body?.question || "").toString().trim();
    const history = parseHistory(req.body?.history);
    const topK = Number(req.body?.top_k || req.body?.topK) || undefined;
    const file = req.file;

    if (!file && !text) {
      return res.status(400).json({ success: false, message: "Either file or text/question is required" });
    }

    const result = await orchestrateAssistantRequest({
      userId: (req as any)?.user?.id,
      fileBuffer: file?.buffer,
      originalName: file?.originalname,
      question: text,
      history,
      topK,
    });

    let imageUrl = "";
    if (file && result?.diagnosis?.prediction) {
      try {
        imageUrl = await new Promise<string>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream({ folder: "diagnoses" }, (error, uploadResult) => {
            if (error) return reject(error);
            resolve(uploadResult?.secure_url || "");
          });
          stream.end(file.buffer);
        });
      } catch (error) {
        console.warn("Assistant image upload skipped:", sanitizeErrorMessage(error));
      }

      if (imageUrl) {
        try {
          const confidence = typeof result.diagnosis.confidence === "number" ? result.diagnosis.confidence : 0.5;
          const severity = confidence > 0.85 ? "high" : confidence > 0.6 ? "medium" : "low";
          await DiagnosisHistory.create({
            user: (req as any)?.user?.id,
            imageUrl,
            diseaseNameAr: result.diagnosis.prediction,
            diseaseNameEn: result.diagnosis.prediction,
            confidence,
            severity,
            isOffline: false,
          });
        } catch (error) {
          console.warn("Assistant diagnosis history save skipped:", sanitizeErrorMessage(error));
        }
      }
    }

    return res.status(200).json({ success: true, ...result, imageUrl: imageUrl || undefined });
  } catch (error) {
    console.error("Assistant pipeline failed:", sanitizeErrorMessage(error));
    return res.status(502).json({ success: false, message: "Assistant request failed" });
  }
};
