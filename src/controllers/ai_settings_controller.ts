import { Request, Response } from "express";
import AiCallLog from "../models/ai_call_log_model";
import { getAiSettings, redactAiSettings, updateAiSettings, clearSettingsCache } from "../services/ai/ai_config_service";
import { askLlm } from "../services/ai/llm_provider";
import { retrieveRagChunks } from "../services/ai/rag_provider";
import { askHuggingFaceIntegrated, HfMode } from "../services/ai/hf_integrated_provider";
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
    // Optionally use Idempotency-Key if provided in headers, simple deduplication not implemented here due to admin scope
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
    
    // Validation bounding
    if (typeof question !== "string" || question.length > 2000) {
      return res.status(400).json({ success: false, message: "Question exceeds maximum length of 2000 characters" });
    }
    
    if (imageBase64 && (typeof imageBase64 !== "string" || imageBase64.length > 10 * 1024 * 1024)) { // Rough 10MB base64 limit
      return res.status(400).json({ success: false, message: "Image base64 payload is too large" });
    }

    const settings = await getAiSettings();
    const results: Record<string, unknown> = {};

    if (provider === "all" || provider === "rag") {
      try {
        const ragResult = await retrieveRagChunks(settings, "test disease", String(question), settings.rag.topK);
        results.rag = { success: true, provider: "rag-retrieve", chunksReturned: ragResult.chunks.length };
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
    const limit = Math.min(Number(req.query.limit) || 50, 100);
    const feature = typeof req.query.feature === "string" ? req.query.feature : "";
    const status = typeof req.query.status === "string" ? req.query.status : "";

    const filter: Record<string, unknown> = {};
    if (feature === "chat" || feature === "diagnosis" || feature === "image_chat") filter.feature = feature;
    if (status === "success" || status === "failure") filter.status = status;

    const logs = await AiCallLog.find(filter)
      .select("-inputMeta") // Redact input meta which might contain personal data or large prompts
      .sort({ createdAt: -1 })
      .limit(limit);
    return res.status(200).json({ success: true, data: logs });
  } catch {
    return res.status(500).json({ success: false, message: "Failed to fetch AI logs" });
  }
};

// ─── AI Mode Switching ────────────────────────────────────────────────────────

const VALID_MODES = ["rag_openai", "hf_grok", "hf_v8", "hf_v62"] as const;
type AiMode = typeof VALID_MODES[number];

/**
 * PATCH /api/admin/ai-settings/mode
 * تحديث ترتيب وأولوية أوضاع الذكاء الاصطناعي بشكل فوري
 * Body: { aiModePriority: ["rag_openai", "hf_grok", ...] }
 */
export const patchAiMode = async (req: Request, res: Response) => {
  try {
    const { aiModePriority } = req.body || {};
    if (!Array.isArray(aiModePriority) || aiModePriority.length === 0) {
      return res.status(400).json({
        success: false,
        message: `aiModePriority must be a non-empty array of valid modes.`,
      });
    }

    const invalidModes = aiModePriority.filter(m => !VALID_MODES.includes(m as AiMode));
    if (invalidModes.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Invalid modes in priority list: ${invalidModes.join(", ")}. Must be one of: ${VALID_MODES.join(", ")}`,
      });
    }

    // تحديث في قاعدة البيانات
    await updateAiSettings({ aiModePriority } as any, (req as any)?.user?.id);

    // مسح الـ Cache الفوري لضمان قراءة الوضع الجديد في الطلب القادم
    clearSettingsCache();

    console.log(`[AI_MODE] Priority updated to: [${aiModePriority.join(", ")}] by user: ${(req as any)?.user?.id || "admin"}`);

    return res.status(200).json({
      success: true,
      message: `AI mode priority updated successfully`,
      aiModePriority,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: sanitizeErrorMessage(error) || "Failed to update AI mode priority",
    });
  }
};

/**
 * POST /api/admin/ai-settings/test-mode
 * اختبار أي وضع بدون تغيير الوضع الحالي للنظام
 * Body: { mode: AiMode, question: string }
 */
export const testAiMode = async (req: Request, res: Response) => {
  const t0 = Date.now();
  try {
    const { mode, question = "What are the symptoms of tomato early blight?" } = req.body || {};

    if (!VALID_MODES.includes(mode as AiMode)) {
      return res.status(400).json({
        success: false,
        message: `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}`,
      });
    }

    if (typeof question !== "string" || question.trim().length === 0 || question.length > 1000) {
      return res.status(400).json({ success: false, message: "Question must be 1–1000 characters" });
    }

    const settings = await getAiSettings();

    // rag_openai: اختبار الـ RAG + LLM بشكل مباشر
    if (mode === "rag_openai") {
      let ragChunks = 0;
      let llmAnswer = "";
      let ragError = "";
      let llmError = "";

      try {
        const ragResult = await retrieveRagChunks(settings, "early blight", question, 3);
        ragChunks = ragResult.chunks.length;
        const llmResult = await askLlm(settings, question, "llm", []);
        llmAnswer = llmResult.message.slice(0, 500);
      } catch (e) {
        ragError = sanitizeErrorMessage(e) || "RAG/LLM failed";
      }

      return res.status(200).json({
        success: !ragError && !llmError,
        mode,
        answer: llmAnswer || ragError || llmError,
        ragChunks,
        latencyMs: Date.now() - t0,
        error: ragError || llmError || undefined,
      });
    }

    // HF modes: اختبار الـ HF endpoint مباشرة
    const hfMode = mode as HfMode;
    const hf = (settings as any).hfIntegrated || {};
    const endpointMap: Record<HfMode, string> = {
      hf_grok: hf.grokEndpointUrl || "",
      hf_v8:   hf.v8EndpointUrl   || "",
      hf_v62:  hf.v62EndpointUrl  || "",
    };

    const result = await askHuggingFaceIntegrated(
      hfMode,
      endpointMap[hfMode],
      question,
      [],
      hf.timeoutMs || 40_000
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        mode,
        answer: result.answer,
        latencyMs: result.latencyMs,
        provider: result.provider,
      });
    }

    return res.status(200).json({
      success: false,
      mode,
      error: result.error,
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      mode: req.body?.mode,
      error: sanitizeErrorMessage(error) || "Test failed",
      latencyMs: Date.now() - t0,
    });
  }
};




