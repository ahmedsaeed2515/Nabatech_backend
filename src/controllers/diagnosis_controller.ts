import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import DiagnosisHistory from "../models/diagnosis_history_model";
import { orchestrateAssistantRequest } from "../services/ai/ai_orchestrator_service";
import { isProviderError, sanitizeErrorMessage } from "../services/ai/ai_errors";
import { buildAssistantPrompt } from "../services/ai/assistant_prompt_builder";
import { DiseaseKnowledgeRecord } from "../models/disease_knowledge_record_model";

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
          advice: existing.advice,
          source: existing.source,
          provider: { name: existing.provider },
          lowConfidenceWarning: existing.uncertain ? "Low confidence result" : null,
          needsNewImage: existing.needsNewImage,
        });
      }
    }

    // 1. Run CNN inference only
    const cnnResult = await orchestrateAssistantRequest({
      userId,
      fileBuffer: req.file.buffer,
      originalName: req.file.originalname,
      question: "",
      history: [],
      skipAdvice: true,
    });

    const prediction = cnnResult.diagnosis?.prediction || "unknown";
    const confidence = cnnResult.diagnosis?.confidence ?? 0;
    const candidates = cnnResult.diagnosis?.candidates || [];
    const isUncertain = Boolean(cnnResult.lowConfidenceWarning);

    // 2. KB Lookup
    const kbRecord = await DiseaseKnowledgeRecord.findOne({
      $or: [
        { diseaseNameEn: prediction },
        { diseaseNameEn: prediction.replace(/_/g, " ") }
      ]
    });
    
    const diseaseNameAr = kbRecord?.diseaseNameAr || prediction;
    const severity = kbRecord?.severity || (confidence > 0.6 ? "medium" : "low");

    // 3. Upload to Cloudinary folder "diagnoses" only if inference succeeded
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

    let uploadResult = { secure_url: "https://via.placeholder.com/224", public_id: "mock_id" };
    if (process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'dummy' && process.env.CLOUDINARY_API_KEY !== '123456789012345') {
      uploadResult = await cloudinaryUpload(req.file.buffer);
    }
    uploadedImagePublicId = uploadResult.public_id;

    // 4. Generate LLM Advice asynchronously (Sequential flow)
    const prompt = buildAssistantPrompt({
      userQuestion: "Explain the diagnosis in simple terms and give safe care guidance.",
      history: [],
      cnn: {
        prediction,
        confidence,
        candidates,
      },
      lowConfidenceWarning: cnnResult.lowConfidenceWarning || "",
      kbAdvice: kbRecord?.advice || undefined,
      kbSeverity: kbRecord?.severity || undefined,
    });

    const llmResult = await orchestrateAssistantRequest({
      userId,
      question: prompt,
      history: [],
    });

    // 5. Save diagnosis log in database history

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
      diagnosisSource: "online",
      modelId: cnnResult.diagnosis?.provider || "unknown",
      provider: cnnResult.provider,
      source: llmResult.source,
      sourceIds: [...cnnResult.providerChain, ...(llmResult.providerChain || [])],
      uncertain: isUncertain,
      needsNewImage: cnnResult.needsNewImage,
      advice: kbRecord?.advice || llmResult.message,
      llmResponse: llmResult.message,
      cnnResult: JSON.stringify({ prediction, confidence, candidates }),
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
      advice: llmResult.message || null,
      source: llmResult.source,
      provider: { name: cnnResult.provider, llm: llmResult.provider },
      lowConfidenceWarning: cnnResult.lowConfidenceWarning || null,
      needsNewImage: cnnResult.needsNewImage || false,
      uncertain: isUncertain,
    });
  } catch (error: any) {
    console.error("Diagnosis error:", sanitizeErrorMessage(error));
    if (uploadedImagePublicId) {
      // Outbox / Rollback mechanism for Cloudinary if DB/LLM failed
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
