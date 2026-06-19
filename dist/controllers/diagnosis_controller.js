"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDiagnosisAdvice = exports.syncOfflineDiagnosis = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const ai_orchestrator_service_1 = require("../services/ai/ai_orchestrator_service");
const ai_errors_1 = require("../services/ai/ai_errors");
const assistant_prompt_builder_1 = require("../services/ai/assistant_prompt_builder");
const disease_knowledge_record_model_1 = require("../models/disease_knowledge_record_model");
// @desc    Save an offline diagnosis result from Flutter
// @route   POST /api/diagnosis/sync-offline
// @access  Private
const syncOfflineDiagnosis = async (req, res) => {
    let uploadedImagePublicId = null;
    try {
        const userId = req.user.id;
        const { diseaseNameEn, diseaseNameAr, confidence, severity, imageUrl, plantId, diagnosedAt, clientOperationId, modelId, modelVersion, candidates, advice, provider } = req.body;
        if (!clientOperationId) {
            return res.status(400).json({ success: false, message: "clientOperationId is required for offline sync" });
        }
        if (!diseaseNameEn) {
            return res.status(400).json({ success: false, message: "diseaseNameEn is required" });
        }
        const existing = await diagnosis_history_model_1.default.findOne({ user: userId, clientOperationId });
        if (existing) {
            return res.status(409).json({ success: false, message: "Diagnosis already synced", id: existing._id });
        }
        let finalImageUrl = imageUrl;
        let finalImagePublicId = undefined;
        // If a file is uploaded during sync
        if (req.file) {
            const cloudinaryUpload = (fileBuffer) => {
                return new Promise((resolve, reject) => {
                    const stream = cloudinary_1.default.uploader.upload_stream({ folder: "diagnoses" }, (error, result) => {
                        if (error)
                            return reject(error);
                        resolve({ secure_url: result.secure_url, public_id: result.public_id });
                    });
                    stream.end(fileBuffer);
                });
            };
            const uploadResult = await cloudinaryUpload(req.file.buffer);
            finalImageUrl = uploadResult.secure_url;
            finalImagePublicId = uploadResult.public_id;
            uploadedImagePublicId = uploadResult.public_id;
        }
        else if (imageUrl) {
            // Reject device-local paths (e.g. file:// or /data/user/...)
            if (imageUrl.startsWith("file://") || imageUrl.startsWith("/") || !imageUrl.startsWith("http")) {
                return res.status(400).json({ success: false, message: "Invalid imageUrl. Must provide a valid http URL or attach a file." });
            }
        }
        else {
            return res.status(400).json({ success: false, message: "Either file or confirmed imageUrl is required" });
        }
        const prediction = diseaseNameEn || "unknown";
        const kbRecord = await disease_knowledge_record_model_1.DiseaseKnowledgeRecord.findOne({
            $or: [
                { diseaseNameEn: prediction },
                { diseaseNameEn: prediction.replace(/_/g, " ") }
            ]
        });
        const finalDiseaseNameAr = diseaseNameAr || kbRecord?.diseaseNameAr || prediction;
        const finalSeverity = severity || kbRecord?.severity || (Number(confidence) > 0.6 ? "medium" : "low");
        let historyRecord = await diagnosis_history_model_1.default.findOne({ user: userId, clientOperationId });
        if (historyRecord) {
            historyRecord.diseaseNameAr = finalDiseaseNameAr;
            historyRecord.diseaseNameEn = prediction;
            historyRecord.confidence = Number(confidence) || 0;
            historyRecord.severity = finalSeverity;
            historyRecord.candidates = candidates;
            historyRecord.advice = advice;
            historyRecord.isOffline = true;
            historyRecord.diagnosisSource = "offline";
            if (diagnosedAt)
                historyRecord.diagnosedAt = new Date(diagnosedAt);
            await historyRecord.save();
        }
        else {
            historyRecord = await diagnosis_history_model_1.default.create({
                user: userId,
                clientOperationId,
                plantId,
                imageUrl: finalImageUrl,
                imagePublicId: finalImagePublicId,
                diseaseNameAr: finalDiseaseNameAr,
                diseaseNameEn: prediction,
                confidence: Number(confidence) || 0,
                severity: finalSeverity,
                candidates,
                isOffline: true,
                diagnosisSource: "offline",
                modelId,
                modelVersion,
                provider: provider || "offline",
                advice,
                needsNewImage: false,
                diagnosedAt: diagnosedAt ? new Date(diagnosedAt) : undefined,
            });
        }
        return res.status(201).json({ success: true, id: historyRecord._id, historyId: historyRecord._id });
    }
    catch (error) {
        if (uploadedImagePublicId) {
            try {
                await cloudinary_1.default.uploader.destroy(uploadedImagePublicId);
            }
            catch (delErr) {
                console.error("Failed to cleanup Cloudinary on sync error:", (0, ai_errors_1.sanitizeErrorMessage)(delErr));
            }
        }
        return res.status(500).json({ success: false, message: "Failed to sync offline diagnosis" });
    }
};
exports.syncOfflineDiagnosis = syncOfflineDiagnosis;
// @desc    Generate AI advice asynchronously for an existing diagnosis
// @route   GET /api/diagnosis/:historyId/advice
// @access  Private
const generateDiagnosisAdvice = async (req, res) => {
    try {
        const userId = req.user.id;
        const historyId = req.params.historyId;
        const history = await diagnosis_history_model_1.default.findOne({ _id: historyId, user: userId });
        if (!history) {
            return res.status(404).json({ success: false, message: "Diagnosis history not found" });
        }
        if (history.advice) {
            return res.status(200).json({ success: true, advice: history.advice, source: history.source });
        }
        const prompt = (0, assistant_prompt_builder_1.buildAssistantPrompt)({
            userQuestion: "Explain the diagnosis in simple terms and give safe care guidance.",
            history: [],
            cnn: {
                prediction: history.diseaseNameEn,
                confidence: history.confidence,
                candidates: history.candidates || [],
            },
            lowConfidenceWarning: history.uncertain ? "Low confidence result" : "",
        });
        const result = await (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
            userId,
            question: prompt,
            history: [],
        });
        history.advice = result.message;
        if (result.source)
            history.source = result.source;
        await history.save();
        res.status(200).json({
            success: true,
            advice: history.advice,
            source: history.source,
        });
    }
    catch (error) {
        console.error("Advice generation error:", (0, ai_errors_1.sanitizeErrorMessage)(error));
        const status = (0, ai_errors_1.isProviderError)(error) ? 502 : 500;
        res.status(status).json({ success: false, message: "Failed to generate advice" });
    }
};
exports.generateDiagnosisAdvice = generateDiagnosisAdvice;
