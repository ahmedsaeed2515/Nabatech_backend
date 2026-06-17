"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminAiLogs = exports.testAdminAiSettings = exports.putAdminAiSettings = exports.getAdminAiSettings = void 0;
const ai_call_log_model_1 = __importDefault(require("../models/ai_call_log_model"));
const ai_config_service_1 = require("../services/ai/ai_config_service");
const llm_provider_1 = require("../services/ai/llm_provider");
const rag_provider_1 = require("../services/ai/rag_provider");
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
                const rag = await (0, rag_provider_1.askRag)(settings, String(question), [], settings.rag.topK);
                results.rag = { success: true, provider: rag.provider, source: rag.source };
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
