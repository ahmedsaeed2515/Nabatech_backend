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
exports.generateDiagnosisAdvice = exports.predictOnline = exports.syncOfflineDiagnosis = void 0;
var cloudinary_1 = __importDefault(require("../config/cloudinary"));
var diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
var ai_orchestrator_service_1 = require("../services/ai/ai_orchestrator_service");
var ai_errors_1 = require("../services/ai/ai_errors");
var assistant_prompt_builder_1 = require("../services/ai/assistant_prompt_builder");
var disease_knowledge_record_model_1 = require("../models/disease_knowledge_record_model");
// @desc    Save an offline diagnosis result from Flutter
// @route   POST /api/diagnosis/sync-offline
// @access  Private
var syncOfflineDiagnosis = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var uploadedImagePublicId, userId, _a, diseaseNameEn, diseaseNameAr, confidence, severity, imageUrl, plantId, diagnosedAt, clientOperationId, modelId, modelVersion, candidates, advice, provider, existing, finalImageUrl, finalImagePublicId, cloudinaryUpload, uploadResult, prediction, kbRecord, finalDiseaseNameAr, finalSeverity, historyRecord, error_1, delErr_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                uploadedImagePublicId = null;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 12, , 17]);
                userId = req.user.id;
                _a = req.body, diseaseNameEn = _a.diseaseNameEn, diseaseNameAr = _a.diseaseNameAr, confidence = _a.confidence, severity = _a.severity, imageUrl = _a.imageUrl, plantId = _a.plantId, diagnosedAt = _a.diagnosedAt, clientOperationId = _a.clientOperationId, modelId = _a.modelId, modelVersion = _a.modelVersion, candidates = _a.candidates, advice = _a.advice, provider = _a.provider;
                if (!clientOperationId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "clientOperationId is required for offline sync" })];
                }
                if (!diseaseNameEn) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "diseaseNameEn is required" })];
                }
                return [4 /*yield*/, diagnosis_history_model_1.default.findOne({ user: userId, clientOperationId: clientOperationId })];
            case 2:
                existing = _b.sent();
                if (existing) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: "Diagnosis already synced", id: existing._id })];
                }
                finalImageUrl = imageUrl;
                finalImagePublicId = undefined;
                if (!req.file) return [3 /*break*/, 4];
                cloudinaryUpload = function (fileBuffer) {
                    return new Promise(function (resolve, reject) {
                        var stream = cloudinary_1.default.uploader.upload_stream({ folder: "diagnoses" }, function (error, result) {
                            if (error)
                                return reject(error);
                            resolve({ secure_url: result.secure_url, public_id: result.public_id });
                        });
                        stream.end(fileBuffer);
                    });
                };
                return [4 /*yield*/, cloudinaryUpload(req.file.buffer)];
            case 3:
                uploadResult = _b.sent();
                finalImageUrl = uploadResult.secure_url;
                finalImagePublicId = uploadResult.public_id;
                uploadedImagePublicId = uploadResult.public_id;
                return [3 /*break*/, 5];
            case 4:
                if (imageUrl) {
                    // Reject device-local paths (e.g. file:// or /data/user/...)
                    if (imageUrl.startsWith("file://") || imageUrl.startsWith("/") || !imageUrl.startsWith("http")) {
                        return [2 /*return*/, res.status(400).json({ success: false, message: "Invalid imageUrl. Must provide a valid http URL or attach a file." })];
                    }
                }
                else {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Either file or confirmed imageUrl is required" })];
                }
                _b.label = 5;
            case 5:
                prediction = diseaseNameEn || "unknown";
                return [4 /*yield*/, disease_knowledge_record_model_1.DiseaseKnowledgeRecord.findOne({
                        $or: [
                            { diseaseNameEn: prediction },
                            { diseaseNameEn: prediction.replace(/_/g, " ") }
                        ]
                    })];
            case 6:
                kbRecord = _b.sent();
                finalDiseaseNameAr = diseaseNameAr || (kbRecord === null || kbRecord === void 0 ? void 0 : kbRecord.diseaseNameAr) || prediction;
                finalSeverity = severity || (kbRecord === null || kbRecord === void 0 ? void 0 : kbRecord.severity) || (Number(confidence) > 0.6 ? "medium" : "low");
                return [4 /*yield*/, diagnosis_history_model_1.default.findOne({ user: userId, clientOperationId: clientOperationId })];
            case 7:
                historyRecord = _b.sent();
                if (!historyRecord) return [3 /*break*/, 9];
                historyRecord.diseaseNameAr = finalDiseaseNameAr;
                historyRecord.diseaseNameEn = prediction;
                historyRecord.confidence = Number(confidence) || 0;
                historyRecord.severity = finalSeverity;
                historyRecord.candidates = candidates;
                historyRecord.advice = advice;
                historyRecord.isOffline = true;
                historyRecord.diagnosisSource = "offline";
                if (diagnosedAt)
                    historyRecord.diagnosedAt = new Date(diagnosedAt);
                return [4 /*yield*/, historyRecord.save()];
            case 8:
                _b.sent();
                return [3 /*break*/, 11];
            case 9: return [4 /*yield*/, diagnosis_history_model_1.default.create({
                    user: userId,
                    clientOperationId: clientOperationId,
                    plantId: plantId,
                    imageUrl: finalImageUrl,
                    imagePublicId: finalImagePublicId,
                    diseaseNameAr: finalDiseaseNameAr,
                    diseaseNameEn: prediction,
                    confidence: Number(confidence) || 0,
                    severity: finalSeverity,
                    candidates: candidates,
                    isOffline: true,
                    diagnosisSource: "offline",
                    modelId: modelId,
                    modelVersion: modelVersion,
                    provider: provider || "offline",
                    advice: advice,
                    needsNewImage: false,
                    diagnosedAt: diagnosedAt ? new Date(diagnosedAt) : undefined,
                })];
            case 10:
                historyRecord = _b.sent();
                _b.label = 11;
            case 11: return [2 /*return*/, res.status(201).json({ success: true, id: historyRecord._id, historyId: historyRecord._id })];
            case 12:
                error_1 = _b.sent();
                if (!uploadedImagePublicId) return [3 /*break*/, 16];
                _b.label = 13;
            case 13:
                _b.trys.push([13, 15, , 16]);
                return [4 /*yield*/, cloudinary_1.default.uploader.destroy(uploadedImagePublicId)];
            case 14:
                _b.sent();
                return [3 /*break*/, 16];
            case 15:
                delErr_1 = _b.sent();
                console.error("Failed to cleanup Cloudinary on sync error:", (0, ai_errors_1.sanitizeErrorMessage)(delErr_1));
                return [3 /*break*/, 16];
            case 16: return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to sync offline diagnosis" })];
            case 17: return [2 /*return*/];
        }
    });
}); };
exports.syncOfflineDiagnosis = syncOfflineDiagnosis;
// @desc    Predict disease from an image using the ML API
// @route   POST /api/diagnosis/predict
// @access  Private
var predictOnline = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, mlService, prediction, cloudinaryUpload, uploadResult, historyRecord, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId = req.user.id;
                if (!req.file) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Image file is required" })];
                }
                mlService = new (require("../services/ai/disease_detection_service").DiseaseDetectionService)();
                return [4 /*yield*/, mlService.predictFromImage(req.file.buffer, req.file.originalname)];
            case 1:
                prediction = _a.sent();
                cloudinaryUpload = function (fileBuffer) {
                    return new Promise(function (resolve, reject) {
                        var stream = cloudinary_1.default.uploader.upload_stream({ folder: "diagnoses" }, function (error, result) {
                            if (error)
                                return reject(error);
                            resolve({ secure_url: result.secure_url, public_id: result.public_id });
                        });
                        stream.end(fileBuffer);
                    });
                };
                return [4 /*yield*/, cloudinaryUpload(req.file.buffer)];
            case 2:
                uploadResult = _a.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.create({
                        user: userId,
                        imageUrl: uploadResult.secure_url,
                        imagePublicId: uploadResult.public_id,
                        diseaseNameEn: prediction.diseaseNameEn,
                        confidence: prediction.confidence,
                        candidates: prediction.candidates,
                        isOffline: false,
                        diagnosisSource: "online",
                        provider: "python_ml",
                        needsNewImage: false,
                        diagnosedAt: new Date(),
                    })];
            case 3:
                historyRecord = _a.sent();
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        prediction: prediction,
                        historyId: historyRecord._id
                    })];
            case 4:
                error_2 = _a.sent();
                console.error("ML Prediction Error:", error_2.message);
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to predict disease from image" })];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.predictOnline = predictOnline;
// @desc    Generate AI advice asynchronously for an existing diagnosis
// @route   GET /api/diagnosis/:historyId/advice
// @access  Private
var generateDiagnosisAdvice = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, historyId, history_1, prompt_1, result, error_3, status_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId = req.user.id;
                historyId = req.params.historyId;
                return [4 /*yield*/, diagnosis_history_model_1.default.findOne({ _id: historyId, user: userId })];
            case 1:
                history_1 = _a.sent();
                if (!history_1) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Diagnosis history not found" })];
                }
                if (history_1.advice) {
                    return [2 /*return*/, res.status(200).json({ success: true, advice: history_1.advice, source: history_1.source })];
                }
                prompt_1 = (0, assistant_prompt_builder_1.buildAssistantPrompt)({
                    userQuestion: "Explain the diagnosis in simple terms and give safe care guidance.",
                    history: [],
                    cnn: {
                        prediction: history_1.diseaseNameEn,
                        confidence: history_1.confidence,
                        candidates: history_1.candidates || [],
                    },
                    lowConfidenceWarning: history_1.uncertain ? "Low confidence result" : "",
                });
                return [4 /*yield*/, (0, ai_orchestrator_service_1.orchestrateAssistantRequest)({
                        userId: userId,
                        question: prompt_1,
                        history: [],
                    })];
            case 2:
                result = _a.sent();
                history_1.advice = result.message;
                if (result.source)
                    history_1.source = result.source;
                return [4 /*yield*/, history_1.save()];
            case 3:
                _a.sent();
                res.status(200).json({
                    success: true,
                    advice: history_1.advice,
                    source: history_1.source,
                });
                return [3 /*break*/, 5];
            case 4:
                error_3 = _a.sent();
                console.error("Advice generation error:", (0, ai_errors_1.sanitizeErrorMessage)(error_3));
                status_1 = (0, ai_errors_1.isProviderError)(error_3) ? 502 : 500;
                res.status(status_1).json({ success: false, message: "Failed to generate advice" });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.generateDiagnosisAdvice = generateDiagnosisAdvice;
