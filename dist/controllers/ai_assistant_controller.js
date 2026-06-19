"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.postGenerateDraft = exports.postAssistantRequest = void 0;
const ai_orchestrator_service_1 = require("../services/ai/ai_orchestrator_service");
const ai_errors_1 = require("../services/ai/ai_errors");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const message_model_1 = __importDefault(require("../models/message_model"));
const disease_knowledge_record_model_1 = require("../models/disease_knowledge_record_model");
const diagnosis_schemas_1 = require("../validation/diagnosis_schemas");
const crypto_1 = __importDefault(require("crypto"));
const parseHistory = (raw) => {
    if (Array.isArray(raw))
        return raw;
    if (typeof raw === "string" && raw.trim()) {
        try {
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    return [];
};
const postAssistantRequest = async (req, res) => {
    let uploadedImagePublicId = null;
    try {
        const text = (req.body?.text || req.body?.question || "").toString().trim();
        const history = parseHistory(req.body?.history);
        const topK = Number(req.body?.top_k || req.body?.topK) || undefined;
        const clientOperationId = req.body?.clientOperationId;
        const file = req.file;
        if (!file && !text) {
            return res.status(400).json({ success: false, message: "Either file or text/question is required" });
        }
        if (!(0, diagnosis_schemas_1.validateHistory)(history)) {
            return res.status(400).json({ success: false, message: "Invalid history format or length" });
        }
        if (!(0, diagnosis_schemas_1.validateQuestion)(text)) {
            return res.status(400).json({ success: false, message: "Question exceeds maximum length" });
        }
        if (!(0, diagnosis_schemas_1.validateTopK)(topK)) {
            return res.status(400).json({ success: false, message: "Invalid top_k parameter" });
        }
        const userId = req?.user?.id;
        const requestId = crypto_1.default.randomUUID();
        if (clientOperationId) {
            const existing = await diagnosis_history_model_1.default.findOne({ user: userId, clientOperationId });
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
        // 1. Run inference
        const result = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            userId,
            fileBuffer: file?.buffer,
            originalName: file?.originalname,
            question: text,
            history,
            topK,
        });
        let imageUrl = "";
        if (file) {
            try {
                const uploadResult = await new Promise((resolve, reject) => {
                    const stream = cloudinary_1.default.uploader.upload_stream({ folder: "diagnoses" }, (error, uploadResult) => {
                        if (error)
                            return reject(error);
                        resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
                    });
                    stream.end(file.buffer);
                });
                imageUrl = uploadResult.secure_url;
                uploadedImagePublicId = uploadResult.public_id;
            }
            catch (error) {
                console.warn("Assistant image upload skipped:", (0, ai_errors_1.sanitizeErrorMessage)(error));
            }
            if (imageUrl) {
                if (result?.diagnosis?.prediction) {
                    try {
                        const prediction = result.diagnosis.prediction;
                        const kbRecord = await disease_knowledge_record_model_1.DiseaseKnowledgeRecord.findOne({
                            $or: [
                                { diseaseNameEn: prediction },
                                { diseaseNameEn: prediction.replace(/_/g, " ") }
                            ]
                        });
                        const confidence = typeof result.diagnosis.confidence === "number" ? result.diagnosis.confidence : 0.5;
                        const severity = kbRecord?.severity || (confidence > 0.6 ? "medium" : "low");
                        const diseaseNameAr = kbRecord?.diseaseNameAr || prediction;
                        await diagnosis_history_model_1.default.create({
                            user: userId,
                            clientOperationId,
                            imageUrl,
                            imagePublicId: uploadedImagePublicId,
                            diseaseNameAr,
                            diseaseNameEn: prediction,
                            confidence,
                            severity,
                            isOffline: false,
                            modelId: result.diagnosis.provider || "unknown",
                            provider: result.provider,
                            source: result.source,
                            sourceIds: result.providerChain,
                            uncertain: Boolean(result.lowConfidenceWarning),
                            needsNewImage: result.needsNewImage,
                            advice: kbRecord?.advice || result.message,
                            llmResponse: result.message,
                            cnnResult: JSON.stringify(result.diagnosis),
                            ragContext: result.ragContext ? [result.ragContext] : [],
                        });
                    }
                    catch (error) {
                        console.warn("Assistant diagnosis history save failed:", (0, ai_errors_1.sanitizeErrorMessage)(error));
                        if (uploadedImagePublicId) {
                            try {
                                await cloudinary_1.default.uploader.destroy(uploadedImagePublicId);
                                imageUrl = "";
                                uploadedImagePublicId = null;
                            }
                            catch (delErr) {
                                console.error("Failed to cleanup Cloudinary on history save error:", (0, ai_errors_1.sanitizeErrorMessage)(delErr));
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
                    await message_model_1.default.create({
                        user: userId,
                        sender: "user",
                        role: "user",
                        text: userQuestion,
                        conversationId: imageConversationId,
                        requestId,
                        clientOperationId,
                        status: "sent",
                        imageUrl, // ✅ image URL stored on the user message
                        diagnosisResult: result.diagnosis
                            ? {
                                prediction: result.diagnosis.prediction,
                                confidence: result.diagnosis.confidence,
                                candidates: result.diagnosis.candidates || [],
                            }
                            : undefined,
                    });
                    // Assistant message — stores the LLM response for this image
                    if (result.message) {
                        await message_model_1.default.create({
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
                }
                catch (msgError) {
                    // Message persistence failure is non-fatal — diagnosis was already saved
                    console.warn("Image chat message persistence failed:", (0, ai_errors_1.sanitizeErrorMessage)(msgError));
                }
            }
        }
        return res.status(200).json({ success: true, ...result, imageUrl: imageUrl || undefined, uncertain: Boolean(result.lowConfidenceWarning) });
    }
    catch (error) {
        console.error("Assistant pipeline failed:", (0, ai_errors_1.sanitizeErrorMessage)(error));
        if (uploadedImagePublicId) {
            try {
                await cloudinary_1.default.uploader.destroy(uploadedImagePublicId);
            }
            catch (delErr) {
                console.error("Failed to cleanup Cloudinary on assistant request error:", (0, ai_errors_1.sanitizeErrorMessage)(delErr));
            }
        }
        return res.status(502).json({ success: false, message: "Assistant request failed" });
    }
};
exports.postAssistantRequest = postAssistantRequest;
const postGenerateDraft = async (req, res) => {
    try {
        const text = (req.body?.text || req.body?.question || "").toString().trim();
        const history = parseHistory(req.body?.history);
        const diagnosisResult = req.body?.diagnosisResult;
        if (!text && history.length === 0) {
            return res.status(400).json({ success: false, message: "History or question is required" });
        }
        const { generateCommunityDraft } = await Promise.resolve().then(() => __importStar(require("../services/ai/draft_generator")));
        const draft = await generateCommunityDraft({
            userQuestion: text,
            history,
            diagnosisResult,
        });
        return res.status(200).json({ success: true, draft });
    }
    catch (error) {
        console.error("Draft generation failed:", (0, ai_errors_1.sanitizeErrorMessage)(error));
        return res.status(500).json({ success: false, message: "Draft generation failed" });
    }
};
exports.postGenerateDraft = postGenerateDraft;
