import { Request, Response } from "express";
import axios from "axios";
import FormData from "form-data";
import cloudinary from "../config/cloudinary";
import DiagnosisHistory from "../models/diagnosis_history_model";

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

    // 2. Proxy request to Hugging Face Space CNN API
    const cnnUrl = "https://abdallah110-cnnn.hf.space/predict";
    const formData = new FormData();
    formData.append("file", req.file.buffer, { filename: req.file.originalname });

    let prediction = "";
    let confidence = 0.95;

    try {
      const response = await axios.post(cnnUrl, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 35000,
      });

      const data = response.data as any;
      prediction = data.prediction || data.label || data.class || "";

      const rawConf = data.confidence ?? data.score ?? data.probability;
      if (rawConf !== undefined) {
        const numConf = Number(rawConf);
        confidence = numConf > 1.0 ? numConf / 100.0 : numConf;
      }

      if (!prediction) {
        throw new Error("No prediction label returned from model");
      }
    } catch (apiError: any) {
      console.error("CNN Hugging Face Space request failed:", apiError.message || apiError);
      return res.status(500).json({
        message: "Inference failed at remote CNN Space",
        error: apiError.message || apiError,
      });
    }

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
    });
  } catch (error: any) {
    console.error("Diagnosis error:", error);
    res.status(500).json({ message: "Inference failed", error: error.message || error });
  }
};
