"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testAiMode = exports.patchAiMode = exports.getAdminAiLogs = exports.testAdminAiSettings = exports.putAdminAiSettings = exports.getAdminAiSettings = void 0;
const ai_call_log_model_1 = __importDefault(require("../models/ai_call_log_model"));
const ai_config_service_1 = require("../services/ai/ai_config_service");
const llm_provider_1 = require("../services/ai/llm_provider");
const rag_provider_1 = require("../services/ai/rag_provider");
const hf_integrated_provider_1 = require("../services/ai/hf_integrated_provider");
const ai_orchestrator_service_1 = require("../services/ai/ai_orchestrator_service");
const ai_errors_1 = require("../services/ai/ai_errors");
const getAdminAiSettings = async (_req, res) => {
    try {
        const settings = await (0, ai_config_service_1.getAiSettings)();
        return res.status(200).json({ success: true, data: (0, ai_config_service_1.redactAiSettings)(settings) });
    }
    catch {
        return res.status(500).json({ success: false, message: "Failed to load AI settings" });
    }
};
exports.getAdminAiSettings = getAdminAiSettings;
const putAdminAiSettings = async (req, res) => {
    try {
        // Optionally use Idempotency-Key if provided in headers, simple deduplication not implemented here due to admin scope
        const raw = (req.body || {});
        const updated = await (0, ai_config_service_1.updateAiSettings)(raw, req?.user?.id);
        return res.status(200).json({ success: true, data: (0, ai_config_service_1.redactAiSettings)(updated) });
    }
    catch (error) {
        return res.status(400).json({ success: false, message: (0, ai_errors_1.sanitizeErrorMessage)(error) || "Failed to update AI settings" });
    }
};
exports.putAdminAiSettings = putAdminAiSettings;
const testAdminAiSettings = async (req, res) => {
    try {
        const { provider = "all", question = "Hello", imageBase64 } = req.body || {};
        // Validation bounding
        if (typeof question !== "string" || question.length > 2000) {
            return res.status(400).json({ success: false, message: "Question exceeds maximum length of 2000 characters" });
        }
        if (imageBase64 && (typeof imageBase64 !== "string" || imageBase64.length > 10 * 1024 * 1024)) { // Rough 10MB base64 limit
            return res.status(400).json({ success: false, message: "Image base64 payload is too large" });
        }
        const settings = await (0, ai_config_service_1.getAiSettings)();
        const results = {};
        if (provider === "all" || provider === "rag") {
            try {
                const ragResult = await (0, rag_provider_1.retrieveRagChunks)(settings, "test disease", String(question), settings.rag.topK);
                results.rag = { success: true, provider: "rag-retrieve", chunksReturned: ragResult.chunks.length };
            }
            catch (error) {
                results.rag = { success: false, error: (0, ai_errors_1.sanitizeErrorMessage)(error) || "RAG test failed" };
            }
        }
        if (provider === "all" || provider === "llm") {
            try {
                const llm = await (0, llm_provider_1.askLlm)(settings, String(question), "llm");
                results.llm = { success: true, provider: llm.provider, source: llm.source };
            }
            catch (error) {
                results.llm = { success: false, error: (0, ai_errors_1.sanitizeErrorMessage)(error) || "LLM test failed" };
            }
        }
        if (provider === "all" || provider === "cnn") {
            if (typeof imageBase64 === "string" && imageBase64.trim()) {
                try {
                    const raw = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
                    const buffer = Buffer.from(raw, "base64");
                    const cnn = await (0, ai_orchestrator_service_1.orchestrateDiagnosis)({
                        userId: req?.user?.id,
                        fileBuffer: buffer,
                        originalName: "admin-test.jpg",
                    });
                    results.cnn = { success: true, provider: cnn.provider, prediction: cnn.prediction, confidence: cnn.confidence };
                }
                catch (error) {
                    results.cnn = { success: false, error: (0, ai_errors_1.sanitizeErrorMessage)(error) || "CNN test failed" };
                }
            }
            else {
                results.cnn = {
                    success: false,
                    error: "Provide imageBase64 for CNN test, or use /api/diagnosis/predict with image upload.",
                };
            }
        }
        return res.status(200).json({ success: true, data: results });
    }
    catch {
        return res.status(500).json({ success: false, message: "Failed to test AI settings" });
    }
};
exports.testAdminAiSettings = testAdminAiSettings;
const getAdminAiLogs = async (req, res) => {
    try {
        const limit = Math.min(Number(req.query.limit) || 50, 100);
        const feature = typeof req.query.feature === "string" ? req.query.feature : "";
        const status = typeof req.query.status === "string" ? req.query.status : "";
        const filter = {};
        if (feature === "chat" || feature === "diagnosis" || feature === "image_chat")
            filter.feature = feature;
        if (status === "success" || status === "failure")
            filter.status = status;
        const logs = await ai_call_log_model_1.default.find(filter)
            .select("-inputMeta") // Redact input meta which might contain personal data or large prompts
            .sort({ createdAt: -1 })
            .limit(limit);
        return res.status(200).json({ success: true, data: logs });
    }
    catch {
        return res.status(500).json({ success: false, message: "Failed to fetch AI logs" });
    }
};
exports.getAdminAiLogs = getAdminAiLogs;
// ─── AI Mode Switching ────────────────────────────────────────────────────────
const VALID_MODES = ["rag_openai", "hf_grok", "hf_v8", "hf_v62"];
/**
 * PATCH /api/admin/ai-settings/mode
 * تحديث ترتيب وأولوية أوضاع الذكاء الاصطناعي بشكل فوري
 * Body: { aiModePriority: ["rag_openai", "hf_grok", ...] }
 */
const patchAiMode = async (req, res) => {
    try {
        const { aiModePriority } = req.body || {};
        if (!Array.isArray(aiModePriority) || aiModePriority.length === 0) {
            return res.status(400).json({
                success: false,
                message: `aiModePriority must be a non-empty array of valid modes.`,
            });
        }
        const invalidModes = aiModePriority.filter(m => !VALID_MODES.includes(m));
        if (invalidModes.length > 0) {
            return res.status(400).json({
                success: false,
                message: `Invalid modes in priority list: ${invalidModes.join(", ")}. Must be one of: ${VALID_MODES.join(", ")}`,
            });
        }
        // تحديث في قاعدة البيانات
        await (0, ai_config_service_1.updateAiSettings)({ aiModePriority }, req?.user?.id);
        // مسح الـ Cache الفوري لضمان قراءة الوضع الجديد في الطلب القادم
        (0, ai_config_service_1.clearSettingsCache)();
        console.log(`[AI_MODE] Priority updated to: [${aiModePriority.join(", ")}] by user: ${req?.user?.id || "admin"}`);
        return res.status(200).json({
            success: true,
            message: `AI mode priority updated successfully`,
            aiModePriority,
        });
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            message: (0, ai_errors_1.sanitizeErrorMessage)(error) || "Failed to update AI mode priority",
        });
    }
};
exports.patchAiMode = patchAiMode;
/**
 * POST /api/admin/ai-settings/test-mode
 * اختبار أي وضع بدون تغيير الوضع الحالي للنظام
 * Body: { mode: AiMode, question: string }
 */
const testAiMode = async (req, res) => {
    const t0 = Date.now();
    try {
        const { mode, question = "What are the symptoms of tomato early blight?" } = req.body || {};
        if (!VALID_MODES.includes(mode)) {
            return res.status(400).json({
                success: false,
                message: `Invalid mode. Must be one of: ${VALID_MODES.join(", ")}`,
            });
        }
        if (typeof question !== "string" || question.trim().length === 0 || question.length > 1000) {
            return res.status(400).json({ success: false, message: "Question must be 1–1000 characters" });
        }
        const settings = await (0, ai_config_service_1.getAiSettings)();
        // rag_openai: اختبار الـ RAG + LLM بشكل مباشر
        if (mode === "rag_openai") {
            let ragChunks = 0;
            let llmAnswer = "";
            let ragError = "";
            let llmError = "";
            try {
                const ragResult = await (0, rag_provider_1.retrieveRagChunks)(settings, "early blight", question, 3);
                ragChunks = ragResult.chunks.length;
                const llmResult = await (0, llm_provider_1.askLlm)(settings, question, "llm", []);
                llmAnswer = llmResult.message.slice(0, 500);
            }
            catch (e) {
                ragError = (0, ai_errors_1.sanitizeErrorMessage)(e) || "RAG/LLM failed";
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
        const hfMode = mode;
        const hf = settings.hfIntegrated || {};
        const endpointMap = {
            hf_grok: hf.grokEndpointUrl || "",
            hf_v8: hf.v8EndpointUrl || "",
            hf_v62: hf.v62EndpointUrl || "",
        };
        const result = await (0, hf_integrated_provider_1.askHuggingFaceIntegrated)(hfMode, endpointMap[hfMode], question, [], hf.timeoutMs || 40000);
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
    }
    catch (error) {
        return res.status(500).json({
            success: false,
            mode: req.body?.mode,
            error: (0, ai_errors_1.sanitizeErrorMessage)(error) || "Test failed",
            latencyMs: Date.now() - t0,
        });
    }
};
exports.testAiMode = testAiMode;
