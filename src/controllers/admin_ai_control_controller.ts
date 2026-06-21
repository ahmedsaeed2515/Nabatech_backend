import { Request, Response, NextFunction } from "express";
import AiProvider from "../models/ai_provider_model";
import AiModel from "../models/ai_model_model";
import AiRoutingRule from "../models/ai_routing_rule_model";
import AiBenchmark from "../models/ai_benchmark_model";
import AiCallLog from "../models/ai_call_log_model";
import { encryptSecret, decryptSecret } from "../services/ai/secret_crypto";
import { ok } from "../utils/api_response";
import { clearSettingsCache } from "../services/ai/ai_config_service";

// --- Providers ---
export const getProviders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const providers = await AiProvider.find();
    // Exclude API keys from output
    const safeProviders = providers.map((p) => {
      const obj = p.toObject();
      delete (obj as any).apiKeyEnc;
      return obj;
    });
    return ok(res, { providers: safeProviders });
  } catch (error) {
    next(error);
  }
};

export const createProvider = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, displayName, baseUrl, apiKey } = req.body;
    const provider = await AiProvider.create({
      name,
      displayName,
      baseUrl,
      apiKeyEnc: encryptSecret(apiKey),
    });
    return ok(res, { provider: { id: provider._id, name: provider.name } });
  } catch (error) {
    next(error);
  }
};

// --- Models ---
export const getModels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const models = await AiModel.find().populate("provider", "name displayName baseUrl");
    return ok(res, { models });
  } catch (error) {
    next(error);
  }
};

export const createModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const model = await AiModel.create(req.body);
    clearSettingsCache();
    const populated = await model.populate("provider", "name displayName");
    return ok(res, { model: populated });
  } catch (error) {
    next(error);
  }
};

export const updateModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const model = await AiModel.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate("provider", "name displayName");
    if (!model) return res.status(404).json({ success: false, message: "Model not found" });
    clearSettingsCache();
    return ok(res, { model });
  } catch (error) {
    next(error);
  }
};

export const deleteModel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const model = await AiModel.findByIdAndDelete(req.params.id);
    if (!model) return res.status(404).json({ success: false, message: "Model not found" });
    clearSettingsCache();
    return ok(res, { message: "Model deleted" });
  } catch (error) {
    next(error);
  }
};

// --- Routing Rules ---
export const getRoutingRules = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const rules = await AiRoutingRule.find()
      .populate({
        path: "primaryModel",
        populate: { path: "provider", select: "name displayName" }
      })
      .populate({
        path: "fallbackModels",
        populate: { path: "provider", select: "name displayName" }
      })
      .populate("abTestModel");
    return ok(res, { rules });
  } catch (error) {
    next(error);
  }
};

export const updateRoutingRule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { primaryModel, fallbackModels, abTestActive, abTestModel, abTestSplit, active } = req.body;
    let rule = await AiRoutingRule.findById(req.params.id);
    if (!rule) {
      // Create if it doesn't exist
      if (req.body.useCase) {
         rule = await AiRoutingRule.create(req.body);
      } else {
         return res.status(404).json({ success: false, message: "Rule not found" });
      }
    } else {
      Object.assign(rule, req.body);
      await rule.save();
    }
    
    clearSettingsCache();

    const populated = await rule.populate("primaryModel fallbackModels");
    return ok(res, { rule: populated });
  } catch (error) {
    next(error);
  }
};

// --- Benchmarks ---
export const getBenchmarks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const benchmarks = await AiBenchmark.find().populate("model", "displayName modelId type").sort({ testedAt: -1 }).limit(100);
    return ok(res, { benchmarks });
  } catch (error) {
    next(error);
  }
};

// --- Costs ---
export const getCosts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Requires total input/output token usage per model. 
    // Since `AiCallLog` only has inputMeta/outputMeta or simple latencyMs,
    // we would aggregate it here. For the MVP, we mock aggregation to test UI.
    
    // Attempt aggregate over AiCallLog (assuming we add cost to it soon)
    const costAgg = await AiCallLog.aggregate([
       { $group: { _id: "$modelId", totalCalls: { $sum: 1 }, totalCost: { $sum: { $ifNull: ["$cost", 0] } } } }
    ]);
    
    return ok(res, { costs: costAgg });
  } catch (error) {
    next(error);
  }
};

// --- Logs & Metrics ---
export const getAiLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const { userId, feature, status, startDate, endDate } = req.query;

    const query: any = {};
    if (userId) query.userId = userId;
    if (feature) query.feature = feature;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const total = await AiCallLog.countDocuments(query);
    const logs = await AiCallLog.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    return ok(res, {
      logs,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getToolMetrics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const days = parseInt(req.query.days as string) || 7;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const metrics = await AiCallLog.aggregate([
      { $match: { createdAt: { $gte: cutoff }, toolCalls: { $exists: true, $not: { $size: 0 } } } },
      { $unwind: "$toolCalls" },
      {
        $group: {
          _id: { toolName: "$toolCalls.toolName", status: "$toolCalls.status" },
          count: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: "$_id.toolName",
          success: {
            $sum: { $cond: [{ $eq: ["$_id.status", "success"] }, "$count", 0] }
          },
          failure: {
            $sum: { $cond: [{ $eq: ["$_id.status", "failure"] }, "$count", 0] }
          },
          total: { $sum: "$count" }
        }
      },
      { $sort: { total: -1 } }
    ]);

    return ok(res, { metrics });
  } catch (error) {
    next(error);
  }
};
