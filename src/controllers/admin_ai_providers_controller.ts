import { Request, Response, NextFunction } from "express";
import AiProviderSettings from "../models/ai_provider_settings_model";
import { encryptSecret, decryptSecret } from "../services/ai/secret_crypto";
import { ok } from "../utils/api_response";
import axios from "axios";
import { getProviderManager } from "../services/ai/ai_provider_manager";
import AiCallLog from "../models/ai_call_log_model";

export const getProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providers = await AiProviderSettings.find().sort({ priority: 1 });
    const safeProviders = providers.map((p) => {
      const obj = p.toObject();
      // Mask API key for security
      if (obj.apiKeyEncrypted) {
        (obj as any).hasApiKey = true;
      } else {
        (obj as any).hasApiKey = false;
      }
      delete (obj as any).apiKeyEncrypted;
      return obj;
    });
    return ok(res, { providers: safeProviders });
  } catch (error) {
    next(error);
  }
};

export const createProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { providerName, enabled, priority, defaultProvider, apiKey, llmModel, baseUrl } = req.body;
    
    // If setting as default, unset others
    if (defaultProvider) {
      await AiProviderSettings.updateMany({}, { defaultProvider: false });
    }

    const provider = await AiProviderSettings.create({
      providerName,
      enabled: enabled ?? false,
      priority: priority ?? 99,
      defaultProvider: defaultProvider ?? false,
      apiKeyEncrypted: apiKey ? encryptSecret(apiKey) : "",
      llmModel,
      baseUrl,
      status: "unknown"
    });

    return ok(res, { provider: { id: provider._id, providerName: provider.providerName } });
  } catch (error) {
    next(error);
  }
};

export const updateProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { enabled, priority, defaultProvider, apiKey, llmModel, baseUrl } = req.body;

    const provider = await AiProviderSettings.findById(id);
    if (!provider) {
      return res.status(404).json({ success: false, message: "Provider not found" });
    }

    if (defaultProvider) {
      await AiProviderSettings.updateMany({ _id: { $ne: id } }, { defaultProvider: false });
    }

    if (enabled !== undefined) provider.enabled = enabled;
    if (priority !== undefined) provider.priority = priority;
    if (defaultProvider !== undefined) provider.defaultProvider = defaultProvider;
    if (apiKey) provider.apiKeyEncrypted = encryptSecret(apiKey);
    if (llmModel !== undefined) provider.llmModel = llmModel;
    if (baseUrl !== undefined) provider.baseUrl = baseUrl;

    await provider.save();

    // Re-init the provider manager so it picks up new settings immediately
    const manager = getProviderManager();
    await manager.reloadProviders();

    return ok(res, { message: "Provider updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const checkHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const manager = getProviderManager();
    const results = await manager.checkAllHealth();
    return ok(res, { results });
  } catch (error) {
    next(error);
  }
};

export const testProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const provider = await AiProviderSettings.findById(id);
    if (!provider) return res.status(404).json({ success: false, message: "Provider not found" });

    const manager = getProviderManager();
    const result = await manager.testSingleProvider(provider);
    
    return ok(res, { result });
  } catch (error) {
    next(error);
  }
};

export const getAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Simple aggregation of usage
    const stats = await AiCallLog.aggregate([
      {
        $group: {
          _id: { provider: "$provider", status: "$status" },
          count: { $sum: 1 },
          avgLatency: { $avg: "$latencyMs" },
          totalTokens: { $sum: "$tokensUsed" },
          totalCost: { $sum: "$cost" }
        }
      }
    ]);
    return ok(res, { stats });
  } catch (error) {
    next(error);
  }
};
