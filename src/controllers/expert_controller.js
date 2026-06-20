"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.streamEscalations = exports.resolveEscalation = exports.claimEscalation = exports.getEscalations = exports.updateMyExpertProfile = exports.getExpertProfile = void 0;
var expert_profile_model_1 = __importDefault(require("../models/expert_profile_model"));
var user_model_1 = __importDefault(require("../models/user_model"));
var community_post_model_1 = __importDefault(require("../models/community_post_model"));
var app_error_1 = require("../utils/app_error");
// @desc    Get expert profile by userId
// @route   GET /api/experts/:id
// @access  Private
var getExpertProfile = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var expertId, user, profile, recentPosts, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                expertId = req.params.id;
                return [4 /*yield*/, user_model_1.default.findById(expertId).select('name email role avatarUrl createdAt')];
            case 1:
                user = _a.sent();
                if (!user) {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'User not found' }))];
                }
                if (user.role !== 'expert') {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'INVALID_ROLE', statusCode: 400, message: 'User is not an expert' }))];
                }
                return [4 /*yield*/, expert_profile_model_1.default.findOne({ userId: expertId })];
            case 2:
                profile = _a.sent();
                return [4 /*yield*/, community_post_model_1.default.find({ author: expertId, status: 'visible' })
                        .sort({ createdAt: -1 })
                        .limit(5)];
            case 3:
                recentPosts = _a.sent();
                res.status(200).json({
                    success: true,
                    data: {
                        expert: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            avatarUrl: user.avatarUrl,
                            joinedAt: user.createdAt,
                            role: user.role,
                        },
                        profile: profile || null,
                        recentPosts: recentPosts.map(function (p) { return ({
                            id: p._id,
                            title: p.title,
                            content: p.content,
                            plantTag: p.plantTag,
                            commentsCount: p.commentsCount,
                            likesCount: p.likes,
                            createdAt: p.createdAt,
                        }); }),
                    }
                });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                next(error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getExpertProfile = getExpertProfile;
// @desc    Update current expert's profile
// @route   PUT /api/experts/me/profile
// @access  Private (Expert only)
var updateMyExpertProfile = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, bio, specialization, yearsExperience, user, profile, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = req.user.id;
                _a = req.body, bio = _a.bio, specialization = _a.specialization, yearsExperience = _a.yearsExperience;
                return [4 /*yield*/, user_model_1.default.findById(userId)];
            case 1:
                user = _b.sent();
                if (!user || user.role !== 'expert') {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'FORBIDDEN', statusCode: 403, message: 'Only experts can have profiles' }))];
                }
                return [4 /*yield*/, expert_profile_model_1.default.findOneAndUpdate({ userId: userId }, { $set: { bio: bio, specialization: specialization, yearsExperience: yearsExperience } }, { new: true, upsert: true, runValidators: true })];
            case 2:
                profile = _b.sent();
                res.status(200).json({
                    success: true,
                    data: { profile: profile }
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateMyExpertProfile = updateMyExpertProfile;
// @desc    Get all escalations
// @route   GET /api/experts/admin/escalations
// @access  Private (Admin/Expert)
var getEscalations = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var status_1, query, ExpertEscalation, escalations, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                status_1 = req.query.status;
                query = {};
                if (status_1)
                    query.status = status_1;
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../models/expert_escalation_model")); })];
            case 1:
                ExpertEscalation = (_a.sent()).default;
                return [4 /*yield*/, ExpertEscalation.find(query).sort({ createdAt: -1 })];
            case 2:
                escalations = _a.sent();
                res.status(200).json({
                    success: true,
                    data: { escalations: escalations }
                });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getEscalations = getEscalations;
// @desc    Claim an escalation
// @route   POST /api/experts/admin/escalations/:id/claim
// @access  Private (Admin/Expert)
var claimEscalation = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var adminId, escalationId, ExpertEscalation, escalation, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                adminId = req.user.id;
                escalationId = req.params.id;
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../models/expert_escalation_model")); })];
            case 1:
                ExpertEscalation = (_a.sent()).default;
                return [4 /*yield*/, ExpertEscalation.findById(escalationId)];
            case 2:
                escalation = _a.sent();
                if (!escalation) {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Escalation not found' }))];
                }
                if (escalation.status !== "pending") {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'INVALID_STATE', statusCode: 400, message: 'Escalation is already claimed or resolved' }))];
                }
                escalation.status = "claimed";
                escalation.assignedAdminId = adminId;
                return [4 /*yield*/, escalation.save()];
            case 3:
                _a.sent();
                // Broadcast update via SSE
                broadcastEscalationEvent('claimed', escalation);
                res.status(200).json({
                    success: true,
                    data: { escalation: escalation }
                });
                return [3 /*break*/, 5];
            case 4:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.claimEscalation = claimEscalation;
// @desc    Resolve an escalation
// @route   POST /api/experts/admin/escalations/:id/resolve
// @access  Private (Admin/Expert)
var resolveEscalation = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var adminId, escalationId, response, ExpertEscalation, escalation, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                adminId = req.user.id;
                escalationId = req.params.id;
                response = req.body.response;
                if (!response) {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'VALIDATION_ERROR', statusCode: 400, message: 'Response is required' }))];
                }
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../models/expert_escalation_model")); })];
            case 1:
                ExpertEscalation = (_a.sent()).default;
                return [4 /*yield*/, ExpertEscalation.findById(escalationId)];
            case 2:
                escalation = _a.sent();
                if (!escalation) {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Escalation not found' }))];
                }
                if (escalation.status !== "claimed" || escalation.assignedAdminId !== adminId) {
                    return [2 /*return*/, next(new app_error_1.AppError({ code: 'FORBIDDEN', statusCode: 403, message: 'You must claim this escalation before resolving it' }))];
                }
                escalation.status = "resolved";
                escalation.expertResponse = response;
                escalation.expertId = adminId;
                return [4 /*yield*/, escalation.save()];
            case 3:
                _a.sent();
                // Broadcast update via SSE
                broadcastEscalationEvent('resolved', escalation);
                res.status(200).json({
                    success: true,
                    data: { escalation: escalation }
                });
                return [3 /*break*/, 5];
            case 4:
                error_5 = _a.sent();
                next(error_5);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.resolveEscalation = resolveEscalation;
// --- SSE Implementation for Real-Time Updates ---
var sseClients = [];
var streamEscalations = function (req, res) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders(); // flush the headers to establish SSE
    // Tell the client we connected successfully
    res.write("data: ".concat(JSON.stringify({ type: 'connected' }), "\n\n"));
    sseClients.push(res);
    req.on('close', function () {
        sseClients = sseClients.filter(function (client) { return client !== res; });
    });
};
exports.streamEscalations = streamEscalations;
var broadcastEscalationEvent = function (type, data) {
    var payload = "data: ".concat(JSON.stringify({ type: type, data: data }), "\n\n");
    sseClients.forEach(function (client) {
        try {
            client.write(payload);
        }
        catch (e) {
            console.warn("Error sending SSE to client", e);
        }
    });
};
