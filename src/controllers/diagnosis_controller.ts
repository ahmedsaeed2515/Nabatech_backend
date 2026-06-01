import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import DiagnosisHistory from "../models/diagnosis_history_model";
import { orchestrateDiagnosis } from "../services/ai/ai_orchestrator_service";
import { isProviderError, sanitizeErrorMessage } from "../services/ai/ai_errors";

// Simple translation dictionary for common plant diseases
const translateToAr = (nameEn: string): string => {
  const dict: { [key: string]: string } = {
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
  };
  const key = nameEn.trim().toLowerCase();
  return dict[key] || nameEn;
};

// Simple severity estimator
const estimateSeverity = (confidence: number): string => {
  if (confidence > 0.85) return "high";
  if (confidence > 0.6) return "medium";
  return "low";
};

export const predictPlantDisease = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // 1. Upload to Cloudinary folder "diagnoses"
    const cloudinaryUpload = (fileBuffer: Buffer) => {
      return new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "diagnoses" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result!.secure_url);
          }
        );
        stream.end(fileBuffer);
      });
    };

    const imageUrl = await cloudinaryUpload(req.file.buffer);

    const diagnosis = await orchestrateDiagnosis({
      userId,
      fileBuffer: req.file.buffer,
      originalName: req.file.originalname,
    });
    const prediction = diagnosis.prediction;
    const confidence = diagnosis.confidence ?? 0.95;

    // 3. Save diagnosis log in database history
    const diseaseNameAr = translateToAr(prediction);
    const severity = estimateSeverity(confidence);

    await DiagnosisHistory.create({
      user: userId,
      imageUrl,
      diseaseNameAr,
      diseaseNameEn: prediction,
      confidence,
      severity,
      isOffline: false,
    });

    res.status(200).json({
      success: true,
      prediction,
      confidence,
      imageUrl,
      candidates: diagnosis.candidates || [],
      provider: { name: diagnosis.provider },
    });
  } catch (error: any) {
    console.error("Diagnosis error:", sanitizeErrorMessage(error));
    const status = isProviderError(error) ? 502 : 500;
    res.status(status).json({ success: false, message: "Inference failed" });
  }
};
