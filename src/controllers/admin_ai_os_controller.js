"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAuditLogs = exports.updatePrompt = exports.getPrompts = exports.updatePolicy = exports.getPolicies = exports.updateAgentProfile = exports.getAgentProfiles = void 0;
var ai_agent_profile_model_1 = __importDefault(require("../models/ai_agent_profile_model"));
var ai_memory_policy_model_1 = __importDefault(require("../models/ai_memory_policy_model"));
var ai_tool_policy_model_1 = __importDefault(require("../models/ai_tool_policy_model"));
var ai_escalation_policy_model_1 = __importDefault(require("../models/ai_escalation_policy_model"));
var ai_safety_policy_model_1 = __importDefault(require("../models/ai_safety_policy_model"));
var ai_rag_policy_model_1 = __importDefault(require("../models/ai_rag_policy_model"));
var ai_prompt_template_model_1 = __importDefault(require("../models/ai_prompt_template_model"));
var ai_policy_version_model_1 = __importDefault(require("../models/ai_policy_version_model"));
var api_response_1 = require("../utils/api_response");
// --- Agent Profiles ---
var getAgentProfiles = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var agents, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_agent_profile_model_1.default.find()
                        .populate("systemPrompt routingRule memoryPolicy toolPolicy escalationPolicy safetyPolicy ragPolicy")];
            case 1:
                agents = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { agents: agents })];
            case 2:
                error_1 = _a.sent();
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAgentProfiles = getAgentProfiles;
var updateAgentProfile = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var id, agent, populated, error_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 10, , 11]);
                id = req.params.id;
                return [4 /*yield*/, ai_agent_profile_model_1.default.findById(id)];
            case 1:
                agent = _b.sent();
                if (!!agent) return [3 /*break*/, 5];
                if (!req.body.useCase) return [3 /*break*/, 3];
                return [4 /*yield*/, ai_agent_profile_model_1.default.create(req.body)];
            case 2:
                agent = _b.sent();
                return [3 /*break*/, 4];
            case 3: return [2 /*return*/, res.status(404).json({ success: false, message: "Agent not found" })];
            case 4: return [3 /*break*/, 7];
            case 5:
                Object.assign(agent, req.body);
                return [4 /*yield*/, agent.save()];
            case 6:
                _b.sent();
                _b.label = 7;
            case 7: 
            // Save version history
            return [4 /*yield*/, ai_policy_version_model_1.default.create({
                    policyType: "agent_profile",
                    policyId: agent._id,
                    snapshot: agent.toObject(),
                    updatedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
                })];
            case 8:
                // Save version history
                _b.sent();
                return [4 /*yield*/, agent.populate("systemPrompt routingRule memoryPolicy toolPolicy escalationPolicy safetyPolicy ragPolicy")];
            case 9:
                populated = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { agent: populated })];
            case 10:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.updateAgentProfile = updateAgentProfile;
// --- Policies Generic Fetch ---
var getPolicies = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var memory, tools, escalation, safety, rag, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                return [4 /*yield*/, ai_memory_policy_model_1.default.find()];
            case 1:
                memory = _a.sent();
                return [4 /*yield*/, ai_tool_policy_model_1.default.find()];
            case 2:
                tools = _a.sent();
                return [4 /*yield*/, ai_escalation_policy_model_1.default.find()];
            case 3:
                escalation = _a.sent();
                return [4 /*yield*/, ai_safety_policy_model_1.default.find()];
            case 4:
                safety = _a.sent();
                return [4 /*yield*/, ai_rag_policy_model_1.default.find()];
            case 5:
                rag = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { policies: { memory: memory, tools: tools, escalation: escalation, safety: safety, rag: rag } })];
            case 6:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.getPolicies = getPolicies;
var updatePolicy = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, type, id, Model, policy, error_4;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 9, , 10]);
                _a = req.params, type = _a.type, id = _a.id;
                Model = void 0;
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
                    default: return [2 /*return*/, res.status(400).json({ success: false, message: "Invalid policy type" })];
                }
                return [4 /*yield*/, Model.findById(id)];
            case 1:
                policy = _c.sent();
                if (!!policy) return [3 /*break*/, 5];
                if (!req.body.name) return [3 /*break*/, 3];
                return [4 /*yield*/, Model.create(req.body)];
            case 2:
                policy = _c.sent();
                return [3 /*break*/, 4];
            case 3: return [2 /*return*/, res.status(404).json({ success: false, message: "Policy not found" })];
            case 4: return [3 /*break*/, 7];
            case 5:
                Object.assign(policy, req.body);
                return [4 /*yield*/, policy.save()];
            case 6:
                _c.sent();
                _c.label = 7;
            case 7: return [4 /*yield*/, ai_policy_version_model_1.default.create({
                    policyType: type,
                    policyId: policy._id,
                    snapshot: policy.toObject(),
                    updatedBy: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id
                })];
            case 8:
                _c.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { policy: policy })];
            case 9:
                error_4 = _c.sent();
                next(error_4);
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.updatePolicy = updatePolicy;
// --- Prompts ---
var getPrompts = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var prompts, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_prompt_template_model_1.default.find()];
            case 1:
                prompts = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { prompts: prompts })];
            case 2:
                error_5 = _a.sent();
                next(error_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getPrompts = getPrompts;
var updatePrompt = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var prompt_1, error_6;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 9, , 10]);
                return [4 /*yield*/, ai_prompt_template_model_1.default.findById(req.params.id)];
            case 1:
                prompt_1 = _b.sent();
                if (!!prompt_1) return [3 /*break*/, 5];
                if (!req.body.name) return [3 /*break*/, 3];
                return [4 /*yield*/, ai_prompt_template_model_1.default.create(req.body)];
            case 2:
                prompt_1 = _b.sent();
                return [3 /*break*/, 4];
            case 3: return [2 /*return*/, res.status(404).json({ success: false, message: "Prompt not found" })];
            case 4: return [3 /*break*/, 7];
            case 5:
                Object.assign(prompt_1, req.body);
                return [4 /*yield*/, prompt_1.save()];
            case 6:
                _b.sent();
                _b.label = 7;
            case 7: return [4 /*yield*/, ai_policy_version_model_1.default.create({
                    policyType: "prompt",
                    policyId: prompt_1._id,
                    snapshot: prompt_1.toObject(),
                    updatedBy: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id
                })];
            case 8:
                _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { prompt: prompt_1 })];
            case 9:
                error_6 = _b.sent();
                next(error_6);
                return [3 /*break*/, 10];
            case 10: return [2 /*return*/];
        }
    });
}); };
exports.updatePrompt = updatePrompt;
// --- Rollback / Audit ---
var getAuditLogs = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var logs, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, ai_policy_version_model_1.default.find().sort({ createdAt: -1 }).limit(50).populate("updatedBy", "name email")];
            case 1:
                logs = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { logs: logs })];
            case 2:
                error_7 = _a.sent();
                next(error_7);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAuditLogs = getAuditLogs;
