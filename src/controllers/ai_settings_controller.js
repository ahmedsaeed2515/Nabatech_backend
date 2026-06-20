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
exports.getAdminAiLogs = exports.testAdminAiSettings = exports.putAdminAiSettings = exports.getAdminAiSettings = void 0;
var ai_call_log_model_1 = __importDefault(require("../models/ai_call_log_model"));
var ai_config_service_1 = require("../services/ai/ai_config_service");
var llm_provider_1 = require("../services/ai/llm_provider");
var rag_provider_1 = require("../services/ai/rag_provider");
var ai_orchestrator_service_1 = require("../services/ai/ai_orchestrator_service");
var ai_errors_1 = require("../services/ai/ai_errors");
var getAdminAiSettings = function (_req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var settings, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                return [4 /*yield*/, (0, ai_config_service_1.getAiSettings)()];
            case 1:
                settings = _b.sent();
                return [2 /*return*/, res.status(200).json({ success: true, data: (0, ai_config_service_1.redactAiSettings)(settings) })];
            case 2:
                _a = _b.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to load AI settings" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAdminAiSettings = getAdminAiSettings;
var putAdminAiSettings = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var raw, updated, error_1;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                raw = (req.body || {});
                return [4 /*yield*/, (0, ai_config_service_1.updateAiSettings)(raw, (_a = req === null || req === void 0 ? void 0 : req.user) === null || _a === void 0 ? void 0 : _a.id)];
            case 1:
                updated = _b.sent();
                return [2 /*return*/, res.status(200).json({ success: true, data: (0, ai_config_service_1.redactAiSettings)(updated) })];
            case 2:
                error_1 = _b.sent();
                return [2 /*return*/, res.status(400).json({ success: false, message: (0, ai_errors_1.sanitizeErrorMessage)(error_1) || "Failed to update AI settings" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.putAdminAiSettings = putAdminAiSettings;
var testAdminAiSettings = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b, provider, _c, question, imageBase64, settings, results, ragResult, error_2, llm, error_3, raw, buffer, cnn, error_4, _d;
    var _e;
    return __generator(this, function (_f) {
        switch (_f.label) {
            case 0:
                _f.trys.push([0, 16, , 17]);
                _a = req.body || {}, _b = _a.provider, provider = _b === void 0 ? "all" : _b, _c = _a.question, question = _c === void 0 ? "Hello" : _c, imageBase64 = _a.imageBase64;
                // Validation bounding
                if (typeof question !== "string" || question.length > 2000) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Question exceeds maximum length of 2000 characters" })];
                }
                if (imageBase64 && (typeof imageBase64 !== "string" || imageBase64.length > 10 * 1024 * 1024)) { // Rough 10MB base64 limit
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Image base64 payload is too large" })];
                }
                return [4 /*yield*/, (0, ai_config_service_1.getAiSettings)()];
            case 1:
                settings = _f.sent();
                results = {};
                if (!(provider === "all" || provider === "rag")) return [3 /*break*/, 5];
                _f.label = 2;
            case 2:
                _f.trys.push([2, 4, , 5]);
                return [4 /*yield*/, (0, rag_provider_1.retrieveRagChunks)(settings, "test disease", String(question), settings.rag.topK)];
            case 3:
                ragResult = _f.sent();
                results.rag = { success: true, provider: "rag-retrieve", chunksReturned: ragResult.chunks.length };
                return [3 /*break*/, 5];
            case 4:
                error_2 = _f.sent();
                results.rag = { success: false, error: (0, ai_errors_1.sanitizeErrorMessage)(error_2) || "RAG test failed" };
                return [3 /*break*/, 5];
            case 5:
                if (!(provider === "all" || provider === "llm")) return [3 /*break*/, 9];
                _f.label = 6;
            case 6:
                _f.trys.push([6, 8, , 9]);
                return [4 /*yield*/, (0, llm_provider_1.askLlm)(settings, String(question), "llm")];
            case 7:
                llm = _f.sent();
                results.llm = { success: true, provider: llm.provider, source: llm.source };
                return [3 /*break*/, 9];
            case 8:
                error_3 = _f.sent();
                results.llm = { success: false, error: (0, ai_errors_1.sanitizeErrorMessage)(error_3) || "LLM test failed" };
                return [3 /*break*/, 9];
            case 9:
                if (!(provider === "all" || provider === "cnn")) return [3 /*break*/, 15];
                if (!(typeof imageBase64 === "string" && imageBase64.trim())) return [3 /*break*/, 14];
                _f.label = 10;
            case 10:
                _f.trys.push([10, 12, , 13]);
                raw = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
                buffer = Buffer.from(raw, "base64");
                return [4 /*yield*/, (0, ai_orchestrator_service_1.orchestrateDiagnosis)({
                        userId: (_e = req === null || req === void 0 ? void 0 : req.user) === null || _e === void 0 ? void 0 : _e.id,
                        fileBuffer: buffer,
                        originalName: "admin-test.jpg",
                    })];
            case 11:
                cnn = _f.sent();
                results.cnn = { success: true, provider: cnn.provider, prediction: cnn.prediction, confidence: cnn.confidence };
                return [3 /*break*/, 13];
            case 12:
                error_4 = _f.sent();
                results.cnn = { success: false, error: (0, ai_errors_1.sanitizeErrorMessage)(error_4) || "CNN test failed" };
                return [3 /*break*/, 13];
            case 13: return [3 /*break*/, 15];
            case 14:
                results.cnn = {
                    success: false,
                    error: "Provide imageBase64 for CNN test, or use /api/diagnosis/predict with image upload.",
                };
                _f.label = 15;
            case 15: return [2 /*return*/, res.status(200).json({ success: true, data: results })];
            case 16:
                _d = _f.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to test AI settings" })];
            case 17: return [2 /*return*/];
        }
    });
}); };
exports.testAdminAiSettings = testAdminAiSettings;
var getAdminAiLogs = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var limit, feature, status_1, filter, logs, _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                limit = Math.min(Number(req.query.limit) || 50, 100);
                feature = typeof req.query.feature === "string" ? req.query.feature : "";
                status_1 = typeof req.query.status === "string" ? req.query.status : "";
                filter = {};
                if (feature === "chat" || feature === "diagnosis" || feature === "image_chat")
                    filter.feature = feature;
                if (status_1 === "success" || status_1 === "failure")
                    filter.status = status_1;
                return [4 /*yield*/, ai_call_log_model_1.default.find(filter)
                        .select("-inputMeta") // Redact input meta which might contain personal data or large prompts
                        .sort({ createdAt: -1 })
                        .limit(limit)];
            case 1:
                logs = _b.sent();
                return [2 /*return*/, res.status(200).json({ success: true, data: logs })];
            case 2:
                _a = _b.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to fetch AI logs" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAdminAiLogs = getAdminAiLogs;
