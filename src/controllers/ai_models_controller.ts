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
  manifestVersion: item.manifestVersion || "1.0",
  platform: item.platform || "all",
  minAppVersion: item.minAppVersion || "0.0.0",
  active: item.active !== undefined ? item.active : true,
  rollbackOf: item.rollbackOf,
  publishedAt: item.publishedAt,
});

const isValidSecureUrl = (urlString: string) => {
  try {
    const url = new URL(urlString);
    return url.protocol === "https:" || url.hostname === "localhost" || url.hostname === "127.0.0.1";
  } catch {
    return false;
  }
};

const isValidSha256 = (sha256: string) => {
  return /^[a-fA-F0-9]{64}$/.test(sha256);
};

// @desc    Get AI models manifest
// @route   GET /api/ai-models/manifest
// @access  Public
export const getAiModelsManifest = async (_req: Request, res: Response) => {
  try {
    const items = await AiModelManifestItem.find({ active: true }).sort({ recommended: -1, name: 1 });
    const mapped = items.map((item) => toManifestPayload(item));
    return res
      .status(200)
      .json({ 
        success: true, 
        manifestVersion: "1.0",
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
      manifestVersion,
      platform,
      minAppVersion,
      active,
      rollbackOf,
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

    if (!isValidSha256(sha256)) {
      return res.status(400).json({ success: false, message: "sha256 must be a valid 64-character hex string" });
    }

    if (!isValidSecureUrl(modelUrl) || !isValidSecureUrl(labelsUrl)) {
      return res.status(400).json({ success: false, message: "modelUrl and labelsUrl must be secure HTTPS URLs (or localhost)" });
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
      manifestVersion: manifestVersion ? String(manifestVersion).trim() : "1.0",
      platform: platform ? String(platform).trim() : "all",
      minAppVersion: minAppVersion ? String(minAppVersion).trim() : "0.0.0",
      active: active !== undefined ? Boolean(active) : true,
      rollbackOf: rollbackOf ? String(rollbackOf).trim() : undefined,
    });

    return res.status(201).json({ success: true, data: toManifestPayload(created) });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "Manifest item already exists or recommended uniqueness violated" });
    }
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
      "manifestVersion",
      "platform",
      "minAppVersion",
      "active",
      "rollbackOf"
    ] as const;

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        if (field === "sha256" && !isValidSha256(req.body[field])) {
           return res.status(400).json({ success: false, message: "sha256 must be a valid 64-character hex string" });
        }
        if ((field === "modelUrl" || field === "labelsUrl") && !isValidSecureUrl(req.body[field])) {
           return res.status(400).json({ success: false, message: "Urls must be secure HTTPS URLs (or localhost)" });
        }
        (item as any)[field] = req.body[field];
      }
    }

    await item.save();
    return res.status(200).json({ success: true, data: toManifestPayload(item) });
  } catch (error: any) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "Update violated recommended uniqueness" });
    }
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
        sha256: item.sha256,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // Dummy expiresAt representing a presigned url pattern
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to get proxy URL" });
  }
};

