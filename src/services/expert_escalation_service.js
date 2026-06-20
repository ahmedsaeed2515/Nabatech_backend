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
exports.ExpertEscalationService = void 0;
var expert_escalation_model_1 = __importDefault(require("../models/expert_escalation_model"));
var NotificationService_1 = require("./NotificationService");
var UserRepository_1 = require("../repositories/UserRepository");
var ExpertEscalationService = /** @class */ (function () {
    function ExpertEscalationService() {
    }
    ExpertEscalationService.requestExpertReview = function (args) {
        return __awaiter(this, void 0, void 0, function () {
            var request, experts, _i, experts_1, expert, e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        request = new expert_escalation_model_1.default({
                            userId: args.userId,
                            aiPrediction: args.aiPrediction,
                            aiConfidence: args.aiConfidence,
                            userContext: args.userContext,
                            imagePath: args.imagePath,
                            status: "pending",
                        });
                        return [4 /*yield*/, request.save()];
                    case 1:
                        _a.sent();
                        console.log("[EXPERT_ESCALATION] Created request ".concat(request._id, " for user ").concat(args.userId));
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 10, , 11]);
                        return [4 /*yield*/, this.userRepo.find({
                                role: "expert",
                                interests: {
                                    $in: [
                                        new RegExp("^".concat(args.aiPrediction, "$"), 'i'),
                                        new RegExp('^Plant Pathology$', 'i'),
                                        new RegExp('^Diagnosis$', 'i')
                                    ]
                                }
                            })];
                    case 3:
                        experts = _a.sent();
                        if (!(experts.length === 0)) return [3 /*break*/, 5];
                        return [4 /*yield*/, this.userRepo.find({ role: "expert" })];
                    case 4:
                        experts = _a.sent();
                        _a.label = 5;
                    case 5:
                        _i = 0, experts_1 = experts;
                        _a.label = 6;
                    case 6:
                        if (!(_i < experts_1.length)) return [3 /*break*/, 9];
                        expert = experts_1[_i];
                        if (!expert.fcmToken) return [3 /*break*/, 8];
                        return [4 /*yield*/, this.notificationService.sendPushNotification(expert.fcmToken, {
                                notification: {
                                    title: "New AI Escalation Request",
                                    body: "A low-confidence diagnosis (".concat((args.aiConfidence * 100).toFixed(0), "%) for ").concat(args.aiPrediction, " requires human review.")
                                },
                                data: { type: "EXPERT_ESCALATION", requestId: request._id.toString() }
                            })];
                    case 7:
                        _a.sent();
                        _a.label = 8;
                    case 8:
                        _i++;
                        return [3 /*break*/, 6];
                    case 9: return [3 /*break*/, 11];
                    case 10:
                        e_1 = _a.sent();
                        console.error("[EXPERT_ESCALATION] Failed to send notifications:", e_1);
                        return [3 /*break*/, 11];
                    case 11: return [2 /*return*/, request];
                }
            });
        });
    };
    ExpertEscalationService.getPendingRequests = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, expert_escalation_model_1.default.find({ status: "pending" }).sort({ createdAt: 1 })];
            });
        });
    };
    ExpertEscalationService.updateRequestStatus = function (requestId, status, expertId, expertResponse) {
        return __awaiter(this, void 0, void 0, function () {
            var request, user, statusText, notifErr_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, expert_escalation_model_1.default.findByIdAndUpdate(requestId, { status: status, expertId: expertId, expertResponse: expertResponse }, { new: true })];
                    case 1:
                        request = _a.sent();
                        if (!request) {
                            throw new Error("Escalation request not found");
                        }
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 7, , 8]);
                        return [4 /*yield*/, this.userRepo.findById(request.userId.toString())];
                    case 3:
                        user = _a.sent();
                        if (!(user === null || user === void 0 ? void 0 : user.fcmToken)) return [3 /*break*/, 5];
                        statusText = status === "reviewed" ? "reviewed ✅" : "processed";
                        return [4 /*yield*/, this.notificationService.sendPushNotification(user.fcmToken, {
                                notification: {
                                    title: status === "reviewed" ? "Expert Review Complete ✅" : "Diagnosis Update",
                                    body: "An expert has ".concat(statusText, " your plant diagnosis. ").concat(expertResponse.substring(0, 100))
                                },
                                data: {
                                    type: "EXPERT_REVIEW_COMPLETE",
                                    requestId: request._id.toString(),
                                    status: status
                                }
                            })];
                    case 4:
                        _a.sent();
                        console.log("[EXPERT_ESCALATION] User ".concat(request.userId, " notified of ").concat(status, " review."));
                        return [3 /*break*/, 6];
                    case 5:
                        console.log("[EXPERT_ESCALATION] Request ".concat(requestId, " reviewed. User has no FCM token \u2014 skipping push."));
                        _a.label = 6;
                    case 6: return [3 /*break*/, 8];
                    case 7:
                        notifErr_1 = _a.sent();
                        console.error("[EXPERT_ESCALATION] Failed to notify original user:", notifErr_1);
                        return [3 /*break*/, 8];
                    case 8: return [2 /*return*/, request];
                }
            });
        });
    };
    ExpertEscalationService.notificationService = new NotificationService_1.NotificationService();
    ExpertEscalationService.userRepo = new UserRepository_1.UserRepository();
    return ExpertEscalationService;
}());
exports.ExpertEscalationService = ExpertEscalationService;
