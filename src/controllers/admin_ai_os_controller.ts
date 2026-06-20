import { Request, Response, NextFunction } from "express";
import AiAgentProfile from "../models/ai_agent_profile_model";
import AiMemoryPolicy from "../models/ai_memory_policy_model";
import AiToolPolicy from "../models/ai_tool_policy_model";
import AiEscalationPolicy from "../models/ai_escalation_policy_model";
import AiSafetyPolicy from "../models/ai_safety_policy_model";
import AiRagPolicy from "../models/ai_rag_policy_model";
import AiPromptTemplate from "../models/ai_prompt_template_model";
import AiPolicyVersion from "../models/ai_policy_version_model";
import { ok } from "../utils/api_response";

// --- Agent Profiles ---
export const getAgentProfiles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const agents = await AiAgentProfile.find()
      .populate("systemPrompt routingRule memoryPolicy toolPolicy escalationPolicy safetyPolicy ragPolicy");
    return ok(res, { agents });
  } catch (error) {
    next(error);
  }
};

export const updateAgentProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    let agent = await AiAgentProfile.findById(id);
    if (!agent) {
       // Allow upserting by useCase if requested
       if (req.body.useCase) {
         agent = await AiAgentProfile.create(req.body);
       } else {
         return res.status(404).json({ success: false, message: "Agent not found" });
       }
    } else {
       Object.assign(agent, req.body);
       await agent.save();
    }
    
    // Save version history
    await AiPolicyVersion.create({
       policyType: "agent_profile",
       policyId: agent._id,
       snapshot: agent.toObject(),
       updatedBy: (req as any).user?.id
    });

    const populated = await agent.populate("systemPrompt routingRule memoryPolicy toolPolicy escalationPolicy safetyPolicy ragPolicy");
    return ok(res, { agent: populated });
  } catch (error) {
    next(error);
  }
};

// --- Policies Generic Fetch ---
export const getPolicies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const memory = await AiMemoryPolicy.find();
    const tools = await AiToolPolicy.find();
    const escalation = await AiEscalationPolicy.find();
    const safety = await AiSafetyPolicy.find();
    const rag = await AiRagPolicy.find();
    
    return ok(res, { policies: { memory, tools, escalation, safety, rag } });
  } catch (error) {
    next(error);
  }
};

export const updatePolicy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { type, id } = req.params;
    let Model: any;
    switch (type) {
       case "memory": Model = AiMemoryPolicy; break;
       case "tool": Model = AiToolPolicy; break;
       case "escalation": Model = AiEscalationPolicy; break;
       case "safety": Model = AiSafetyPolicy; break;
       case "rag": Model = AiRagPolicy; break;
       default: return res.status(400).json({ success: false, message: "Invalid policy type" });
    }

    let policy = await Model.findById(id);
    if (!policy) {
       if (req.body.name) {
          policy = await Model.create(req.body);
       } else {
          return res.status(404).json({ success: false, message: "Policy not found" });
       }
    } else {
       Object.assign(policy, req.body);
       await policy.save();
    }

    await AiPolicyVersion.create({
       policyType: type,
       policyId: policy._id,
       snapshot: policy.toObject(),
       updatedBy: (req as any).user?.id
    });

    return ok(res, { policy });
  } catch (error) {
    next(error);
  }
};

// --- Prompts ---
export const getPrompts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prompts = await AiPromptTemplate.find();
    return ok(res, { prompts });
  } catch (error) {
    next(error);
  }
};

export const updatePrompt = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let prompt = await AiPromptTemplate.findById(req.params.id);
    if (!prompt) {
       if (req.body.name) {
          prompt = await AiPromptTemplate.create(req.body);
       } else {
          return res.status(404).json({ success: false, message: "Prompt not found" });
       }
    } else {
       Object.assign(prompt, req.body);
       await prompt.save();
    }

    await AiPolicyVersion.create({
       policyType: "prompt",
       policyId: prompt._id,
       snapshot: prompt.toObject(),
       updatedBy: (req as any).user?.id
    });

    return ok(res, { prompt });
  } catch (error) {
    next(error);
  }
};

// --- Rollback / Audit ---
export const getAuditLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const logs = await AiPolicyVersion.find().sort({ createdAt: -1 }).limit(50).populate("updatedBy", "name email");
    return ok(res, { logs });
  } catch (error) {
    next(error);
  }
};
