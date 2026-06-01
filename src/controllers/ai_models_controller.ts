import { Request, Response } from "express";
import AiModelManifestItem from "../models/ai_model_manifest_item_model";

const toManifestPayload = (item: any) => ({
  id: item.id,
  name: item.name,
  architecture: item.architecture,
  classes: item.classes,
  sizeMb: item.sizeMb,
  inputSize: item.inputSize !== undefined ? item.inputSize : 224,
  normalization: item.normalization || "zero_to_one",
  quantization: item.quantization,
  modelUrl: item.modelUrl,
  labelsUrl: item.labelsUrl,
  sha256: item.sha256,
  recommended: item.recommended,
});

// @desc    Get AI models manifest
// @route   GET /api/ai-models/manifest
// @access  Public
export const getAiModelsManifest = async (_req: Request, res: Response) => {
  try {
    const items = await AiModelManifestItem.find().sort({ recommended: -1, name: 1 });
    const mapped = items.map((item) => toManifestPayload(item));
    return res
      .status(200)
      .json({ 
        success: true, 
        data: mapped,
        models: mapped // For Flutter dynamic downloader compatibility
      });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch AI model manifest" });
  }
};

// @desc    Create AI model manifest item
// @route   POST /api/ai-models/manifest
// @access  Private/Admin
export const createAiModelManifestItem = async (req: Request, res: Response) => {
  try {
    const {
      id,
      name,
      architecture,
      classes,
      sizeMb,
      inputSize,
      normalization,
      quantization,
      modelUrl,
      labelsUrl,
      sha256,
      recommended,
    } = req.body;

    if (
      !id ||
      !name ||
      !architecture ||
      classes === undefined ||
      sizeMb === undefined ||
      !quantization ||
      !modelUrl ||
      !labelsUrl ||
      !sha256
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required manifest fields" });
    }

    const created = await AiModelManifestItem.create({
      id: String(id).trim(),
      name: String(name).trim(),
      architecture: String(architecture).trim(),
      classes: Number(classes),
      sizeMb: Number(sizeMb),
      inputSize: inputSize !== undefined ? Number(inputSize) : 224,
      normalization: normalization ? String(normalization).trim() : "zero_to_one",
      quantization: String(quantization).trim(),
      modelUrl: String(modelUrl).trim(),
      labelsUrl: String(labelsUrl).trim(),
      sha256: String(sha256).trim(),
      recommended: Boolean(recommended),
    });

    return res.status(201).json({ success: true, data: toManifestPayload(created) });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to create AI model manifest item" });
  }
};

// @desc    Update AI model manifest item
// @route   PUT /api/ai-models/manifest/:id
// @access  Private/Admin
export const updateAiModelManifestItem = async (req: Request, res: Response) => {
  try {
    const item = await AiModelManifestItem.findOne({ id: req.params.id });
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "AI model manifest item not found" });
    }

    const fields = [
      "name",
      "architecture",
      "classes",
      "sizeMb",
      "inputSize",
      "normalization",
      "quantization",
      "modelUrl",
      "labelsUrl",
      "sha256",
      "recommended",
    ] as const;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        (item as any)[field] = req.body[field];
      }
    }

    await item.save();
    return res.status(200).json({ success: true, data: toManifestPayload(item) });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update AI model manifest item" });
  }
};

// @desc    Delete AI model manifest item
// @route   DELETE /api/ai-models/manifest/:id
// @access  Private/Admin
export const deleteAiModelManifestItem = async (req: Request, res: Response) => {
  try {
    const deleted = await AiModelManifestItem.findOneAndDelete({ id: req.params.id });
    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "AI model manifest item not found" });
    }
    return res.status(200).json({ success: true, data: { id: deleted.id } });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to delete AI model manifest item" });
  }
};

// @desc    Get proxy URL for manifest item
// @route   GET /api/ai-models/manifest/:id/proxy-url
// @access  Private
export const getAiModelProxyUrl = async (req: Request, res: Response) => {
  try {
    const item = await AiModelManifestItem.findOne({ id: req.params.id });
    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "AI model manifest item not found" });
    }
    return res.status(200).json({
      success: true,
      data: {
        modelUrl: item.modelUrl,
        labelsUrl: item.labelsUrl,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to get proxy URL" });
  }
};

