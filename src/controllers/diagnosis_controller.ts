import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import DiagnosisHistory from "../models/diagnosis_history_model";
import { orchestrateAssistantRequest } from "../services/ai/ai_orchestrator_service";
import { isProviderError, sanitizeErrorMessage } from "../services/ai/ai_errors";
import { buildAssistantPrompt } from "../services/ai/assistant_prompt_builder";
import { DiseaseKnowledgeRecord } from "../models/disease_knowledge_record_model";


// @desc    Save an offline diagnosis result from Flutter
// @route   POST /api/diagnosis/sync-offline
// @access  Private
export const syncOfflineDiagnosis = async (req: Request, res: Response) => {
  let uploadedImagePublicId: string | null = null;
  try {
    const userId = (req as any).user.id;
    const { diseaseNameEn, diseaseNameAr, confidence, severity, imageUrl, plantId, diagnosedAt, clientOperationId, modelId, modelVersion, candidates, advice, provider } = req.body;

    if (!clientOperationId) {
      return res.status(400).json({ success: false, message: "clientOperationId is required for offline sync" });
    }

    if (!diseaseNameEn) {
      return res.status(400).json({ success: false, message: "diseaseNameEn is required" });
    }

    const existing = await DiagnosisHistory.findOne({ user: userId, clientOperationId });
    if (existing) {
      return res.status(409).json({ success: false, message: "Diagnosis already synced", id: existing._id });
    }

    let finalImageUrl = imageUrl;
    let finalImagePublicId = undefined;

    // If a file is uploaded during sync
    if (req.file) {
      const cloudinaryUpload = (fileBuffer: Buffer) => {
        return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "diagnoses" },
            (error, result) => {
              if (error) return reject(error);
              resolve({ secure_url: result!.secure_url, public_id: result!.public_id });
            }
          );
          stream.end(fileBuffer);
        });
      };
      const uploadResult = await cloudinaryUpload(req.file.buffer);
      finalImageUrl = uploadResult.secure_url;
      finalImagePublicId = uploadResult.public_id;
      uploadedImagePublicId = uploadResult.public_id;
    } else if (imageUrl) {
      // Reject device-local paths (e.g. file:// or /data/user/...)
      if (imageUrl.startsWith("file://") || imageUrl.startsWith("/") || !imageUrl.startsWith("http")) {
        return res.status(400).json({ success: false, message: "Invalid imageUrl. Must provide a valid http URL or attach a file." });
      }
    } else {
      return res.status(400).json({ success: false, message: "Either file or confirmed imageUrl is required" });
    }

    const prediction = diseaseNameEn || "unknown";
    const kbRecord = await DiseaseKnowledgeRecord.findOne({
      $or: [
        { diseaseNameEn: prediction },
        { diseaseNameEn: prediction.replace(/_/g, " ") }
      ]
    });

    const finalDiseaseNameAr = diseaseNameAr || kbRecord?.diseaseNameAr || prediction;
    const finalSeverity = severity || kbRecord?.severity || (Number(confidence) > 0.6 ? "medium" : "low");

    let historyRecord = await DiagnosisHistory.findOne({ user: userId, clientOperationId });
    if (historyRecord) {
      historyRecord.diseaseNameAr = finalDiseaseNameAr;
      historyRecord.diseaseNameEn = prediction;
      historyRecord.confidence = Number(confidence) || 0;
      historyRecord.severity = finalSeverity;
      historyRecord.candidates = candidates;
      historyRecord.advice = advice;
      historyRecord.isOffline = true;
      historyRecord.diagnosisSource = "offline";
      if (diagnosedAt) historyRecord.diagnosedAt = new Date(diagnosedAt);
      await historyRecord.save();
    } else {
      historyRecord = await DiagnosisHistory.create({
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
  } catch (error) {
    if (uploadedImagePublicId) {
      try {
        await cloudinary.uploader.destroy(uploadedImagePublicId);
      } catch (delErr) {
        console.error("Failed to cleanup Cloudinary on sync error:", sanitizeErrorMessage(delErr));
      }
    }
    return res.status(500).json({ success: false, message: "Failed to sync offline diagnosis" });
  }
};

// @desc    Predict disease from an image using the CNN provider (HuggingFace Space)
// @route   POST /api/diagnosis/predict
// @access  Private
export const predictOnline = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image file is required" });
    }

    // ✅ FIX: Use the same CNN provider as the orchestrator (HuggingFace Space)
    // instead of the unavailable local Python ML service
    const FormData = require("form-data");
    const { runCnnDiagnosis } = require("../services/ai/cnn_provider");
    const { getAiSettings } = require("../services/ai/ai_config_service");

    const settings = await getAiSettings();
    const formData = new FormData();
    formData.append("file", req.file.buffer, { filename: req.file.originalname || "image.jpg" });

    const rawResult = await runCnnDiagnosis(settings, formData, formData.getHeaders());

    const prediction = {
      diseaseNameEn: rawResult.prediction,
      confidence: rawResult.confidence ?? 0,
      candidates: (rawResult.candidates || []).map((c: any) => ({
        diseaseNameEn: c.label,
        confidence: c.confidence ?? 0,
      })),
      provider: rawResult.provider,
    };

    // Upload image to Cloudinary
    const cloudinaryUpload = (fileBuffer: Buffer) => {
      return new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "diagnoses" },
          (error, result) => {
            if (error) return reject(error);
            resolve({ secure_url: result!.secure_url, public_id: result!.public_id });
          }
        );
        stream.end(fileBuffer);
      });
    };

    let imageUrl = "";
    let imagePublicId = "";
    try {
      const uploadResult = await cloudinaryUpload(req.file.buffer);
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    } catch (cloudErr: any) {
      console.warn("Cloudinary upload failed (non-fatal):", cloudErr.message);
    }

    const historyRecord = await DiagnosisHistory.create({
      user: userId,
      imageUrl,
      imagePublicId,
      diseaseNameEn: prediction.diseaseNameEn,
      confidence: prediction.confidence,
      candidates: prediction.candidates,
      isOffline: false,
      diagnosisSource: "online",
      provider: rawResult.provider || "cnn",
      needsNewImage: (rawResult.confidence ?? 0) < settings.cnn.confidenceThreshold,
      diagnosedAt: new Date(),
    });

    return res.status(200).json({
      success: true,
      prediction,
      historyId: historyRecord._id,
    });
  } catch (error: any) {
    console.error("CNN Prediction Error:", error.message);
    return res.status(500).json({ success: false, message: "Failed to predict disease from image" });
  }
};

// @desc    Generate AI advice asynchronously for an existing diagnosis
// @route   GET /api/diagnosis/:historyId/advice
// @access  Private
export const generateDiagnosisAdvice = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const historyId = req.params.historyId;

    const history = await DiagnosisHistory.findOne({ _id: historyId, user: userId });
    if (!history) {
      return res.status(404).json({ success: false, message: "Diagnosis history not found" });
    }

    if (history.advice) {
      return res.status(200).json({ success: true, advice: history.advice, source: history.source });
    }

    const prompt = buildAssistantPrompt({
      userQuestion: "Explain the diagnosis in simple terms and give safe care guidance.",
      history: [],
      cnn: {
        prediction: history.diseaseNameEn,
        confidence: history.confidence,
        candidates: history.candidates || [],
      },
      lowConfidenceWarning: history.uncertain ? "Low confidence result" : "",
    });

    const result = await orchestrateAssistantRequest({
      userId,
      question: prompt,
      history: [],
    });

    history.advice = result.message;
    if (result.source) history.source = result.source;
    await history.save();

    res.status(200).json({
      success: true,
      advice: history.advice,
      source: history.source,
    });
  } catch (error: any) {
    console.error("Advice generation error:", sanitizeErrorMessage(error));
    const status = isProviderError(error) ? 502 : 500;
    res.status(status).json({ success: false, message: "Failed to generate advice" });
  }
};
