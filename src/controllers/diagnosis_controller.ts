import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import DiagnosisHistory from "../models/diagnosis_history_model";
import { orchestrateAssistantRequest } from "../services/ai/ai_orchestrator_service";
import { isProviderError, sanitizeErrorMessage } from "../services/ai/ai_errors";

// Simple translation dictionary for common plant diseases
export const translateToAr = (nameEn: string): string => {
  const dict: { [key: string]: string } = {
    // CNN class names
    "powdery mildew": "البياض الدقيقي",
    "powdery_mildew": "البياض الدقيقي",
    "leaf spot": "تبقع الأوراق",
    "leaf_spot": "تبقع الأوراق",
    "wheat rust": "صدأ الحنطة",
    "wheat_rust": "صدأ الحنطة",
    "late blight": "اللفحة المتأخرة",
    "late_blight": "اللفحة المتأخرة",
    "early blight": "اللفحة المبكرة",
    "early_blight": "اللفحة المبكرة",
    "aphids": "حشرات المن",
    "spider mites": "العنكبوت الأحمر",
    "spider_mites": "العنكبوت الأحمر",
    "healthy": "سليم",
    "bacterial blight": "اللفحة البكتيرية",
    "bacterial_blight": "اللفحة البكتيرية",
    "mosaic virus": "فيروس الفسيفساء",
    "mosaic_virus": "فيروس الفسيفساء",
    "cercospora leaf spot": "بقعة سيركوسبورا",
    "cercospora_leaf_spot": "بقعة سيركوسبورا",
    "rust": "الصدأ",
    "downy mildew": "البياض الزغبي",
    "downy_mildew": "البياض الزغبي",
    "anthracnose": "الأنثراكنوز",
    "fusarium wilt": "ذبول الفيوزاريوم",
    "fusarium_wilt": "ذبول الفيوزاريوم",
    "nutrient deficiency": "نقص المغذيات",
    "nutrient_deficiency": "نقص المغذيات",
    "root rot": "تعفن الجذور",
    "root_rot": "تعفن الجذور",
    "leaf blight": "لفحة الأوراق",
    "leaf_blight": "لفحة الأوراق",
    "scab": "الجرب",
    "canker": "السرطان",
    "whitefly": "الذبابة البيضاء",
    "mealybug": "البق الدقيقي",
  };
  const key = nameEn.trim().toLowerCase();
  return dict[key] || nameEn;
};

// Simple severity estimator
export const estimateSeverity = (confidence: number, diseaseNameEn?: string): string => {
  const name = (diseaseNameEn || "").toLowerCase();
  if (name === "healthy") return "low";
  if (["root rot", "fusarium wilt", "late blight"].some(d => name.includes(d))) return "high";
  if (confidence > 0.85) return "high";
  if (confidence > 0.6) return "medium";
  return "low";
};

export const predictPlantDisease = async (req: Request, res: Response) => {
  let uploadedImagePublicId: string | null = null;
  try {
    const userId = (req as any).user.id;
    const clientOperationId = req.body.clientOperationId;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    if (clientOperationId) {
      const existing = await DiagnosisHistory.findOne({ user: userId, clientOperationId });
      if (existing) {
        return res.status(200).json({
          success: true,
          historyId: existing._id,
          prediction: existing.diseaseNameEn,
          confidence: existing.confidence,
          diseaseNameAr: existing.diseaseNameAr,
          severity: existing.severity,
          imageUrl: existing.imageUrl,
          candidates: existing.candidates,
          advice: null,
          source: existing.source,
          provider: { name: existing.provider },
          lowConfidenceWarning: existing.uncertain ? "Low confidence result" : null,
          needsNewImage: existing.needsNewImage,
        });
      }
    }

    // 1. Run full pipeline: CNN + LLM advice BEFORE uploading
    const result = await orchestrateAssistantRequest({
      userId,
      fileBuffer: req.file.buffer,
      originalName: req.file.originalname,
      question: "Explain the diagnosis in simple terms and give safe care guidance.",
      history: [],
    });

    const prediction = result.diagnosis?.prediction || "unknown";
    const confidence = result.diagnosis?.confidence ?? 0;
    const candidates = result.diagnosis?.candidates || [];

    // 2. Upload to Cloudinary folder "diagnoses" only if inference succeeded
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
    uploadedImagePublicId = uploadResult.public_id;

    // 3. Save diagnosis log in database history
    const diseaseNameAr = translateToAr(prediction);
    const severity = estimateSeverity(confidence, prediction);

    const historyRecord = await DiagnosisHistory.create({
      user: userId,
      clientOperationId: clientOperationId || undefined,
      plantId: req.body.plantId || undefined,
      imageUrl: uploadResult.secure_url,
      imagePublicId: uploadResult.public_id,
      diseaseNameAr,
      diseaseNameEn: prediction,
      confidence,
      severity,
      candidates: candidates.map((c: any) => ({ label: c.label, confidence: c.confidence })),
      isOffline: false,
      modelId: result.diagnosis?.provider || "unknown",
      provider: result.provider,
      source: result.source,
      sourceIds: result.providerChain,
      uncertain: Boolean(result.lowConfidenceWarning),
      needsNewImage: result.needsNewImage,
    });

    res.status(200).json({
      success: true,
      historyId: historyRecord._id,
      prediction,
      confidence,
      diseaseNameAr,
      severity,
      imageUrl: uploadResult.secure_url,
      candidates,
      advice: result.message || null,
      source: result.source,
      provider: { name: result.provider },
      lowConfidenceWarning: result.lowConfidenceWarning || null,
      needsNewImage: result.needsNewImage || false,
      uncertain: Boolean(result.lowConfidenceWarning),
    });
  } catch (error: any) {
    console.error("Diagnosis error:", sanitizeErrorMessage(error));
    if (uploadedImagePublicId) {
      // Outbox / Rollback mechanism for Cloudinary if DB failed
      try {
        await cloudinary.uploader.destroy(uploadedImagePublicId);
      } catch (delErr) {
        console.error("Failed to cleanup Cloudinary on diagnosis error:", sanitizeErrorMessage(delErr));
      }
    }
    const status = isProviderError(error) ? 502 : 500;
    res.status(status).json({ success: false, message: "Inference failed" });
  }
};

// @desc    Save an offline diagnosis result from Flutter
// @route   POST /api/diagnosis/sync-offline
// @access  Private
export const syncOfflineDiagnosis = async (req: Request, res: Response) => {
  let uploadedImagePublicId: string | null = null;
  try {
    const userId = (req as any).user.id;
    const { diseaseNameEn, diseaseNameAr, confidence, severity, imageUrl, plantId, diagnosedAt, clientOperationId, modelId, modelVersion } = req.body;

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

    const record = await DiagnosisHistory.create({
      user: userId,
      clientOperationId,
      plantId: plantId || undefined,
      imageUrl: finalImageUrl,
      imagePublicId: finalImagePublicId,
      diseaseNameEn,
      diseaseNameAr: diseaseNameAr || translateToAr(diseaseNameEn),
      confidence: Number(confidence) || 0,
      severity: severity || estimateSeverity(Number(confidence) || 0, diseaseNameEn),
      isOffline: true,
      diagnosedAt: diagnosedAt ? new Date(diagnosedAt) : new Date(),
      modelId: modelId || "unknown_offline",
      modelVersion: modelVersion || "unknown",
      provider: "offline",
      uncertain: Number(confidence) < 0.6,
    });

    return res.status(201).json({ success: true, id: record._id, historyId: record._id });
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
