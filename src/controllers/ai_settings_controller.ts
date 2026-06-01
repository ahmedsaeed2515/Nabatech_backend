import { Request, Response } from "express";
import AiCallLog from "../models/ai_call_log_model";
import { getAiSettings, redactAiSettings, updateAiSettings } from "../services/ai/ai_config_service";
import { askLlm } from "../services/ai/llm_provider";
import { askRag } from "../services/ai/rag_provider";
import { orchestrateDiagnosis } from "../services/ai/ai_orchestrator_service";
import { sanitizeErrorMessage } from "../services/ai/ai_errors";

export const getAdminAiSettings = async (_req: Request, res: Response) => {
  try {
    const settings = await getAiSettings();
    return res.status(200).json({ success: true, data: redactAiSettings(settings) });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to load AI settings" });
  }
};

export const putAdminAiSettings = async (req: Request, res: Response) => {
  try {
    const raw = (req.body || {}) as Record<string, unknown>;
    const updated = await updateAiSettings(raw, (req as any)?.user?.id);
    return res.status(200).json({ success: true, data: redactAiSettings(updated) });
  } catch (error: unknown) {
    return res.status(400).json({ success: false, message: sanitizeErrorMessage(error) || "Failed to update AI settings" });
  }
};

export const testAdminAiSettings = async (req: Request, res: Response) => {
  try {
    const { provider = "all", question = "Hello", imageBase64 } = req.body || {};
    const settings = await getAiSettings();
    const results: Record<string, unknown> = {};

    if (provider === "all" || provider === "rag") {
      try {
        const rag = await askRag(settings, String(question), [], settings.rag.topK);
        results.rag = { success: true, provider: rag.provider, source: rag.source };
      } catch (error) {
        results.rag = { success: false, error: sanitizeErrorMessage(error) || "RAG test failed" };
      }
    }

    if (provider === "all" || provider === "llm") {
      try {
        const llm = await askLlm(settings, String(question), "llm");
        results.llm = { success: true, provider: llm.provider, source: llm.source };
      } catch (error) {
        results.llm = { success: false, error: sanitizeErrorMessage(error) || "LLM test failed" };
      }
    }

    if (provider === "all" || provider === "cnn") {
      if (typeof imageBase64 === "string" && imageBase64.trim()) {
        try {
          const raw = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
          const buffer = Buffer.from(raw, "base64");
          const cnn = await orchestrateDiagnosis({
            userId: (req as any)?.user?.id,
            fileBuffer: buffer,
            originalName: "admin-test.jpg",
          });
          results.cnn = { success: true, provider: cnn.provider, prediction: cnn.prediction, confidence: cnn.confidence };
        } catch (error) {
          results.cnn = { success: false, error: sanitizeErrorMessage(error) || "CNN test failed" };
        }
      } else {
        results.cnn = {
          success: false,
          error: "Provide imageBase64 for CNN test, or use /api/diagnosis/predict with image upload.",
        };
      }
    }

    return res.status(200).json({ success: true, data: results });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to test AI settings" });
  }
};

export const getAdminAiLogs = async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const feature = typeof req.query.feature === "string" ? req.query.feature : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";

    const filter: Record<string, unknown> = {};
    if (feature === "chat" || feature === "diagnosis" || feature === "image_chat") filter.feature = feature;
    if (status === "success" || status === "failure") filter.status = status;

    const logs = await AiCallLog.find(filter).sort({ createdAt: -1 }).limit(limit);
    return res.status(200).json({ success: true, data: logs });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch AI logs" });
  }
};
