"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.postQueryLibrary = exports.postGenerateDraft = exports.postAssistantRequest = void 0;
var ai_orchestrator_service_1 = require("../services/ai/ai_orchestrator_service");
var ai_errors_1 = require("../services/ai/ai_errors");
var cloudinary_1 = __importDefault(require("../config/cloudinary"));
var diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
var message_model_1 = __importDefault(require("../models/message_model"));
var disease_knowledge_record_model_1 = require("../models/disease_knowledge_record_model");
var diagnosis_schemas_1 = require("../validation/diagnosis_schemas");
var crypto_1 = __importDefault(require("crypto"));
var parseHistory = function (raw) {
    if (Array.isArray(raw))
        return raw;
    if (typeof raw === "string" && raw.trim()) {
        try {
            var parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch (_a) {
            return [];
        }
    }
    return [];
};
var postAssistantRequest = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var uploadedImagePublicId, text, history_1, topK, clientOperationId, file_1, language, userId, requestId, existing, isSSE_1, result, imageUrl, uploadResult, error_1, prediction, kbRecord, confidence, severity, diseaseNameAr, error_2, delErr_1, imageConversationId, userQuestion, msgError_1, finalResponse, error_3, delErr_2;
    var _a, _b, _c, _d, _e, _f, _g, _h;
    return __generator(this, function (_j) {
        switch (_j.label) {
            case 0:
                uploadedImagePublicId = null;
                _j.label = 1;
            case 1:
                _j.trys.push([1, 24, , 29]);
                text = (((_a = req.body) === null || _a === void 0 ? void 0 : _a.text) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.question) || "").toString().trim();
                history_1 = parseHistory((_c = req.body) === null || _c === void 0 ? void 0 : _c.history);
                topK = Number(((_d = req.body) === null || _d === void 0 ? void 0 : _d.top_k) || ((_e = req.body) === null || _e === void 0 ? void 0 : _e.topK)) || undefined;
                clientOperationId = (_f = req.body) === null || _f === void 0 ? void 0 : _f.clientOperationId;
                file_1 = req.file;
                language = (req.headers["accept-language"] || "en").toString().split(",")[0].trim().split("-")[0];
                if (!file_1 && !text) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Either file or text/question is required" })];
                }
                if (!(0, diagnosis_schemas_1.validateHistory)(history_1)) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Invalid history format or length" })];
                }
                if (!(0, diagnosis_schemas_1.validateQuestion)(text)) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Question exceeds maximum length" })];
                }
                if (!(0, diagnosis_schemas_1.validateTopK)(topK)) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Invalid top_k parameter" })];
                }
                userId = (_g = req === null || req === void 0 ? void 0 : req.user) === null || _g === void 0 ? void 0 : _g.id;
                requestId = crypto_1.default.randomUUID();
                if (!clientOperationId) return [3 /*break*/, 3];
                return [4 /*yield*/, diagnosis_history_model_1.default.findOne({ user: userId, clientOperationId: clientOperationId })];
            case 2:
                existing = _j.sent();
                if (existing) {
                    return [2 /*return*/, res.status(200).json({
                            success: true,
                            mode: existing.imageUrl ? "image_chat" : "chat",
                            message: "Retrieved existing record",
                            imageUrl: existing.imageUrl,
                            diagnosis: {
                                prediction: existing.diseaseNameEn,
                                confidence: existing.confidence,
                                candidates: existing.candidates,
                                provider: existing.provider
                            }
                        })];
                }
                _j.label = 3;
            case 3:
                isSSE_1 = req.headers.accept === "text/event-stream";
                if (isSSE_1) {
                    res.setHeader("Content-Type", "text/event-stream");
                    res.setHeader("Cache-Control", "no-cache");
                    res.setHeader("Connection", "keep-alive");
                    res.flushHeaders();
                }
                return [4 /*yield*/, (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
                        userId: userId,
                        fileBuffer: file_1 === null || file_1 === void 0 ? void 0 : file_1.buffer,
                        originalName: file_1 === null || file_1 === void 0 ? void 0 : file_1.originalname,
                        question: text,
                        history: history_1,
                        topK: topK,
                        language: language,
                        onProgress: function (phase) {
                            if (isSSE_1) {
                                res.write("data: ".concat(JSON.stringify({ type: "progress", phase: phase }), "\n\n"));
                            }
                        }
                    })];
            case 4:
                result = _j.sent();
                imageUrl = "";
                if (!file_1) return [3 /*break*/, 23];
                _j.label = 5;
            case 5:
                _j.trys.push([5, 7, , 8]);
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        var stream = cloudinary_1.default.uploader.upload_stream({ folder: "diagnoses" }, function (error, uploadResult) {
                            if (error)
                                return reject(error);
                            resolve({ secure_url: uploadResult.secure_url, public_id: uploadResult.public_id });
                        });
                        stream.end(file_1.buffer);
                    })];
            case 6:
                uploadResult = _j.sent();
                imageUrl = uploadResult.secure_url;
                uploadedImagePublicId = uploadResult.public_id;
                return [3 /*break*/, 8];
            case 7:
                error_1 = _j.sent();
                console.warn("Assistant image upload skipped:", (0, ai_errors_1.sanitizeErrorMessage)(error_1));
                return [3 /*break*/, 8];
            case 8:
                if (!imageUrl) return [3 /*break*/, 23];
                if (!((_h = result === null || result === void 0 ? void 0 : result.diagnosis) === null || _h === void 0 ? void 0 : _h.prediction)) return [3 /*break*/, 17];
                _j.label = 9;
            case 9:
                _j.trys.push([9, 12, , 17]);
                prediction = result.diagnosis.prediction;
                return [4 /*yield*/, disease_knowledge_record_model_1.DiseaseKnowledgeRecord.findOne({
                        $or: [
                            { diseaseNameEn: prediction },
                            { diseaseNameEn: prediction.replace(/_/g, " ") }
                        ]
                    })];
            case 10:
                kbRecord = _j.sent();
                confidence = typeof result.diagnosis.confidence === "number" ? result.diagnosis.confidence : 0.5;
                severity = (kbRecord === null || kbRecord === void 0 ? void 0 : kbRecord.severity) || (confidence > 0.6 ? "medium" : "low");
                diseaseNameAr = (kbRecord === null || kbRecord === void 0 ? void 0 : kbRecord.diseaseNameAr) || prediction;
                return [4 /*yield*/, diagnosis_history_model_1.default.create({
                        user: userId,
                        clientOperationId: clientOperationId,
                        imageUrl: imageUrl,
                        imagePublicId: uploadedImagePublicId,
                        diseaseNameAr: diseaseNameAr,
                        diseaseNameEn: prediction,
                        confidence: confidence,
                        severity: severity,
                        isOffline: false,
                        modelId: result.diagnosis.provider || "unknown",
                        provider: result.provider,
                        source: result.source,
                        sourceIds: result.providerChain,
                        uncertain: Boolean(result.lowConfidenceWarning),
                        needsNewImage: result.needsNewImage,
                        advice: (kbRecord === null || kbRecord === void 0 ? void 0 : kbRecord.advice) || result.message,
                        llmResponse: result.message,
                        cnnResult: JSON.stringify(result.diagnosis),
                        ragContext: result.ragContext ? [result.ragContext] : [],
                    })];
            case 11:
                _j.sent();
                return [3 /*break*/, 17];
            case 12:
                error_2 = _j.sent();
                console.warn("Assistant diagnosis history save failed:", (0, ai_errors_1.sanitizeErrorMessage)(error_2));
                if (!uploadedImagePublicId) return [3 /*break*/, 16];
                _j.label = 13;
            case 13:
                _j.trys.push([13, 15, , 16]);
                return [4 /*yield*/, cloudinary_1.default.uploader.destroy(uploadedImagePublicId)];
            case 14:
                _j.sent();
                imageUrl = "";
                uploadedImagePublicId = null;
                return [3 /*break*/, 16];
            case 15:
                delErr_1 = _j.sent();
                console.error("Failed to cleanup Cloudinary on history save error:", (0, ai_errors_1.sanitizeErrorMessage)(delErr_1));
                return [3 /*break*/, 16];
            case 16: return [3 /*break*/, 17];
            case 17:
                imageConversationId = "conv-image-".concat(userId);
                userQuestion = text || "Please analyze this plant image.";
                _j.label = 18;
            case 18:
                _j.trys.push([18, 22, , 23]);
                // User message — includes image URL and diagnosis result
                return [4 /*yield*/, message_model_1.default.create({
                        user: userId,
                        sender: "user",
                        role: "user",
                        text: userQuestion,
                        conversationId: imageConversationId,
                        requestId: requestId,
                        clientOperationId: clientOperationId,
                        status: "sent",
                        imageUrl: imageUrl, // ✅ image URL stored on the user message
                        diagnosisResult: result.diagnosis
                            ? {
                                prediction: result.diagnosis.prediction,
                                confidence: result.diagnosis.confidence,
                                candidates: result.diagnosis.candidates || [],
                            }
                            : undefined,
                    })];
            case 19:
                // User message — includes image URL and diagnosis result
                _j.sent();
                if (!result.message) return [3 /*break*/, 21];
                return [4 /*yield*/, message_model_1.default.create({
                        user: userId,
                        sender: "llm",
                        role: "assistant",
                        text: result.message,
                        conversationId: imageConversationId,
                        requestId: requestId,
                        status: "sent",
                        provider: result.provider,
                        source: result.source,
                        sourceIds: result.providerChain,
                    })];
            case 20:
                _j.sent();
                _j.label = 21;
            case 21: return [3 /*break*/, 23];
            case 22:
                msgError_1 = _j.sent();
                // Message persistence failure is non-fatal — diagnosis was already saved
                console.warn("Image chat message persistence failed:", (0, ai_errors_1.sanitizeErrorMessage)(msgError_1));
                return [3 /*break*/, 23];
            case 23:
                finalResponse = __assign(__assign({ success: true }, result), { imageUrl: imageUrl || undefined, uncertain: Boolean(result.lowConfidenceWarning) });
                if (isSSE_1) {
                    res.write("data: ".concat(JSON.stringify({ type: "result", data: finalResponse }), "\n\n"));
                    return [2 /*return*/, res.end()];
                }
                return [2 /*return*/, res.status(200).json(finalResponse)];
            case 24:
                error_3 = _j.sent();
                console.error("Assistant pipeline failed:", (0, ai_errors_1.sanitizeErrorMessage)(error_3));
                if (!uploadedImagePublicId) return [3 /*break*/, 28];
                _j.label = 25;
            case 25:
                _j.trys.push([25, 27, , 28]);
                return [4 /*yield*/, cloudinary_1.default.uploader.destroy(uploadedImagePublicId)];
            case 26:
                _j.sent();
                return [3 /*break*/, 28];
            case 27:
                delErr_2 = _j.sent();
                console.error("Failed to cleanup Cloudinary on assistant request error:", (0, ai_errors_1.sanitizeErrorMessage)(delErr_2));
                return [3 /*break*/, 28];
            case 28:
                if (req.headers.accept === "text/event-stream") {
                    res.write("data: ".concat(JSON.stringify({ type: "error", message: "Assistant request failed" }), "\n\n"));
                    return [2 /*return*/, res.end()];
                }
                return [2 /*return*/, res.status(502).json({ success: false, message: "Assistant request failed" })];
            case 29: return [2 /*return*/];
        }
    });
}); };
exports.postAssistantRequest = postAssistantRequest;
var postGenerateDraft = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var text, history_2, diagnosisResult, generateCommunityDraft, draft, error_4;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                text = (((_a = req.body) === null || _a === void 0 ? void 0 : _a.text) || ((_b = req.body) === null || _b === void 0 ? void 0 : _b.question) || "").toString().trim();
                history_2 = parseHistory((_c = req.body) === null || _c === void 0 ? void 0 : _c.history);
                diagnosisResult = (_d = req.body) === null || _d === void 0 ? void 0 : _d.diagnosisResult;
                if (!text && history_2.length === 0) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "History or question is required" })];
                }
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../services/ai/draft_generator")); })];
            case 1:
                generateCommunityDraft = (_e.sent()).generateCommunityDraft;
                return [4 /*yield*/, generateCommunityDraft({
                        userQuestion: text,
                        history: history_2,
                        diagnosisResult: diagnosisResult,
                    })];
            case 2:
                draft = _e.sent();
                return [2 /*return*/, res.status(200).json({ success: true, draft: draft })];
            case 3:
                error_4 = _e.sent();
                console.error("Draft generation failed:", (0, ai_errors_1.sanitizeErrorMessage)(error_4));
                return [2 /*return*/, res.status(500).json({ success: false, message: "Draft generation failed" })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.postGenerateDraft = postGenerateDraft;
var postQueryLibrary = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var query, PlantEmbeddingsService, plants, error_5;
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                query = (((_a = req.body) === null || _a === void 0 ? void 0 : _a.query) || ((_b = req.query) === null || _b === void 0 ? void 0 : _b.query) || "").toString().trim();
                if (!query) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Query is required" })];
                }
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require("../services/plant_embeddings_service")); })];
            case 1:
                PlantEmbeddingsService = (_c.sent()).PlantEmbeddingsService;
                return [4 /*yield*/, PlantEmbeddingsService.searchSimilarPlants(query, 5)];
            case 2:
                plants = _c.sent();
                return [2 /*return*/, res.status(200).json({ success: true, data: plants })];
            case 3:
                error_5 = _c.sent();
                console.error("Library query failed:", (0, ai_errors_1.sanitizeErrorMessage)(error_5));
                return [2 /*return*/, res.status(500).json({ success: false, message: "Library query failed" })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.postQueryLibrary = postQueryLibrary;
