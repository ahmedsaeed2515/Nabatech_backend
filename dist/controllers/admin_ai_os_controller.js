"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.updatePrompt = exports.getPrompts = exports.updatePolicy = exports.getPolicies = exports.updateAgentProfile = exports.getAgentProfiles = void 0;
const ai_agent_profile_model_1 = __importDefault(require("../models/ai_agent_profile_model"));
const ai_memory_policy_model_1 = __importDefault(require("../models/ai_memory_policy_model"));
const ai_tool_policy_model_1 = __importDefault(require("../models/ai_tool_policy_model"));
const ai_escalation_policy_model_1 = __importDefault(require("../models/ai_escalation_policy_model"));
const ai_safety_policy_model_1 = __importDefault(require("../models/ai_safety_policy_model"));
const ai_rag_policy_model_1 = __importDefault(require("../models/ai_rag_policy_model"));
const ai_prompt_template_model_1 = __importDefault(require("../models/ai_prompt_template_model"));
const ai_policy_version_model_1 = __importDefault(require("../models/ai_policy_version_model"));
const api_response_1 = require("../utils/api_response");
// --- Agent Profiles ---
const getAgentProfiles = async (req, res, next) => {
    try {
        const agents = await ai_agent_profile_model_1.default.find()
            .populate("systemPrompt routingRule memoryPolicy toolPolicy escalationPolicy safetyPolicy ragPolicy");
        return (0, api_response_1.ok)(res, { agents });
    }
    catch (error) {
        next(error);
    }
};
exports.getAgentProfiles = getAgentProfiles;
const updateAgentProfile = async (req, res, next) => {
    try {
        const { id } = req.params;
        let agent = await ai_agent_profile_model_1.default.findById(id);
        if (!agent) {
            // Allow upserting by useCase if requested
            if (req.body.useCase) {
                agent = await ai_agent_profile_model_1.default.create(req.body);
            }
            else {
                return res.status(404).json({ success: false, message: "Agent not found" });
            }
        }
        else {
            Object.assign(agent, req.body);
            await agent.save();
        }
        // Save version history
        await ai_policy_version_model_1.default.create({
            policyType: "agent_profile",
            policyId: agent._id,
            snapshot: agent.toObject(),
            updatedBy: req.user?.id
        });
        const populated = await agent.populate("systemPrompt routingRule memoryPolicy toolPolicy escalationPolicy safetyPolicy ragPolicy");
        return (0, api_response_1.ok)(res, { agent: populated });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAgentProfile = updateAgentProfile;
// --- Policies Generic Fetch ---
const getPolicies = async (req, res, next) => {
    try {
        const memory = await ai_memory_policy_model_1.default.find();
        const tools = await ai_tool_policy_model_1.default.find();
        const escalation = await ai_escalation_policy_model_1.default.find();
        const safety = await ai_safety_policy_model_1.default.find();
        const rag = await ai_rag_policy_model_1.default.find();
        return (0, api_response_1.ok)(res, { policies: { memory, tools, escalation, safety, rag } });
    }
    catch (error) {
        next(error);
    }
};
exports.getPolicies = getPolicies;
const updatePolicy = async (req, res, next) => {
    try {
        const { type, id } = req.params;
        let Model;
        switch (type) {
            case "memory":
                Model = ai_memory_policy_model_1.default;
                break;
            case "tool":
                Model = ai_tool_policy_model_1.default;
                break;
            case "escalation":
                Model = ai_escalation_policy_model_1.default;
                break;
            case "safety":
                Model = ai_safety_policy_model_1.default;
                break;
            case "rag":
                Model = ai_rag_policy_model_1.default;
                break;
            default: return res.status(400).json({ success: false, message: "Invalid policy type" });
        }
        let policy = await Model.findById(id);
        if (!policy) {
            if (req.body.name) {
                policy = await Model.create(req.body);
            }
            else {
                return res.status(404).json({ success: false, message: "Policy not found" });
            }
        }
        else {
            Object.assign(policy, req.body);
            await policy.save();
        }
        await ai_policy_version_model_1.default.create({
            policyType: type,
            policyId: policy._id,
            snapshot: policy.toObject(),
            updatedBy: req.user?.id
        });
        return (0, api_response_1.ok)(res, { policy });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePolicy = updatePolicy;
// --- Prompts ---
const getPrompts = async (req, res, next) => {
    try {
        const prompts = await ai_prompt_template_model_1.default.find();
        return (0, api_response_1.ok)(res, { prompts });
    }
    catch (error) {
        next(error);
    }
};
exports.getPrompts = getPrompts;
const updatePrompt = async (req, res, next) => {
    try {
        let prompt = await ai_prompt_template_model_1.default.findById(req.params.id);
        if (!prompt) {
            if (req.body.name) {
                prompt = await ai_prompt_template_model_1.default.create(req.body);
            }
            else {
                return res.status(404).json({ success: false, message: "Prompt not found" });
            }
        }
        else {
            Object.assign(prompt, req.body);
            await prompt.save();
        }
        await ai_policy_version_model_1.default.create({
            policyType: "prompt",
            policyId: prompt._id,
            snapshot: prompt.toObject(),
            updatedBy: req.user?.id
        });
        return (0, api_response_1.ok)(res, { prompt });
    }
    catch (error) {
        next(error);
    }
};
exports.updatePrompt = updatePrompt;
// --- Rollback / Audit ---
const getAuditLogs = async (req, res, next) => {
    try {
        const logs = await ai_policy_version_model_1.default.find().sort({ createdAt: -1 }).limit(50).populate("updatedBy", "name email");
        return (0, api_response_1.ok)(res, { logs });
    }
    catch (error) {
        next(error);
    }
};
exports.getAuditLogs = getAuditLogs;
