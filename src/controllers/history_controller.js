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
exports.updateFeedback = exports.clearHistory = exports.deleteDiagnosis = exports.getDiagnosisById = exports.getHistory = void 0;
var diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
var cloudinary_1 = __importDefault(require("../config/cloudinary"));
var mongoose_1 = __importDefault(require("mongoose"));
// @desc    Get user diagnosis logs (paginated)
// @route   GET /api/history
// @access  Private
var getHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, cursor, limit, feedbackStatus, query, _b, diagnosedAtStr, idStr, cursorDate, pageSize, history_1, hasNextPage, endCursor, lastItem, formattedHistory, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                userId = req.user.id;
                _a = req.query, cursor = _a.cursor, limit = _a.limit, feedbackStatus = _a.feedbackStatus;
                query = { user: userId };
                if (feedbackStatus) {
                    query.feedbackStatus = feedbackStatus;
                }
                if (cursor) {
                    _b = cursor.split("_"), diagnosedAtStr = _b[0], idStr = _b[1];
                    cursorDate = new Date(parseInt(diagnosedAtStr, 10));
                    query.$or = [
                        { diagnosedAt: { $lt: cursorDate } },
                        { diagnosedAt: cursorDate, _id: { $lt: new mongoose_1.default.Types.ObjectId(idStr) } }
                    ];
                }
                pageSize = limit ? parseInt(limit, 10) : 20;
                return [4 /*yield*/, diagnosis_history_model_1.default.find(query)
                        .sort({ diagnosedAt: -1, _id: -1 })
                        .limit(pageSize + 1)];
            case 1:
                history_1 = _c.sent();
                hasNextPage = history_1.length > pageSize;
                if (hasNextPage) {
                    history_1.pop();
                }
                endCursor = null;
                if (history_1.length > 0) {
                    lastItem = history_1[history_1.length - 1];
                    endCursor = "".concat(lastItem.diagnosedAt.getTime(), "_").concat(lastItem._id.toString());
                }
                formattedHistory = history_1.map(function (h) { return ({
                    id: h._id,
                    imageUrl: h.imageUrl,
                    diseaseNameAr: h.diseaseNameAr,
                    diseaseNameEn: h.diseaseNameEn,
                    confidence: h.confidence,
                    severity: h.severity,
                    diagnosedAt: h.diagnosedAt,
                    isOffline: h.isOffline,
                    feedbackStatus: h.feedbackStatus,
                    version: h.version,
                }); });
                res.status(200).json({
                    success: true,
                    data: {
                        items: formattedHistory,
                        pageInfo: {
                            hasNextPage: hasNextPage,
                            endCursor: endCursor
                        }
                    },
                    // legacy alias
                    history: formattedHistory,
                    count: formattedHistory.length
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _c.sent();
                res.status(500).json({ success: false, message: "Failed to fetch diagnosis logs", error: error_1 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getHistory = getHistory;
// @desc    Get a specific diagnosis log by ID
// @route   GET /api/history/:id
// @access  Private
var getDiagnosisById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, log, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                return [4 /*yield*/, diagnosis_history_model_1.default.findOne({ _id: req.params.id, user: userId })];
            case 1:
                log = _a.sent();
                if (!log) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Diagnosis log not found" })];
                }
                res.status(200).json({
                    success: true,
                    data: { diagnosis: log }
                });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                res.status(500).json({ success: false, message: "Failed to fetch log", error: error_2 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getDiagnosisById = getDiagnosisById;
// @desc    Delete a specific diagnosis log
// @route   DELETE /api/history/:id
// @access  Private
var deleteDiagnosis = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, log_1, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                return [4 /*yield*/, diagnosis_history_model_1.default.findOneAndDelete({ _id: req.params.id, user: userId })];
            case 1:
                log_1 = _a.sent();
                if (!log_1) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Diagnosis log not found or unauthorized" })];
                }
                if (log_1.imagePublicId) {
                    // Direct deletion without awaiting heavily or failing the request
                    cloudinary_1.default.uploader.destroy(log_1.imagePublicId).catch(function (err) {
                        console.error("Failed to delete Cloudinary image ".concat(log_1.imagePublicId, ":"), err);
                    });
                }
                res.status(200).json({
                    success: true,
                    data: { id: log_1._id },
                    message: "Diagnosis log deleted successfully" // legacy
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                res.status(500).json({ success: false, message: "Failed to delete log", error: error_3 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteDiagnosis = deleteDiagnosis;
// @desc    Clear all user diagnosis history
// @route   DELETE /api/history
// @access  Private
var clearHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, before, query, logs, deleteResult, publicIds, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.id;
                before = req.query.before;
                query = { user: userId };
                if (before) {
                    query.diagnosedAt = { $lt: new Date(before) };
                }
                return [4 /*yield*/, diagnosis_history_model_1.default.find(query).select("imagePublicId")];
            case 1:
                logs = _a.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.deleteMany(query)];
            case 2:
                deleteResult = _a.sent();
                publicIds = logs.map(function (l) { return l.imagePublicId; }).filter(function (id) { return id; });
                if (publicIds.length > 0) {
                    // Chunk deletions if too many, simple approach for now:
                    Promise.all(publicIds.map(function (id) { return cloudinary_1.default.uploader.destroy(id); })).catch(function (err) {
                        console.error("Failed to delete some Cloudinary images during clearHistory:", err);
                    });
                }
                res.status(200).json({
                    success: true,
                    data: { deletedCount: deleteResult.deletedCount },
                    message: "Diagnosis history cleared successfully" // legacy
                });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _a.sent();
                res.status(500).json({ success: false, message: "Failed to clear history", error: error_4 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.clearHistory = clearHistory;
// @desc    Update user feedback status on a diagnosis
// @route   PUT /api/history/:id/feedback
// @access  Private
var updateFeedback = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, status_1, version, query, log, existing, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                userId = req.user.id;
                _a = req.body, status_1 = _a.status, version = _a.version;
                query = { _id: req.params.id, user: userId };
                if (version !== undefined) {
                    query.version = version;
                }
                return [4 /*yield*/, diagnosis_history_model_1.default.findOneAndUpdate(query, { $set: { feedbackStatus: status_1 }, $inc: { version: 1 } }, { new: true })];
            case 1:
                log = _b.sent();
                if (!!log) return [3 /*break*/, 3];
                return [4 /*yield*/, diagnosis_history_model_1.default.findOne({ _id: req.params.id, user: userId })];
            case 2:
                existing = _b.sent();
                if (existing) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: "Conflict: The record has been modified by another request." })];
                }
                return [2 /*return*/, res.status(404).json({ success: false, message: "Diagnosis record not found" })];
            case 3:
                res.status(200).json({
                    success: true,
                    data: {
                        feedbackStatus: log.feedbackStatus,
                        version: log.version,
                    },
                    message: "Feedback status updated to ".concat(status_1), // legacy
                    feedbackStatus: log.feedbackStatus, // legacy
                });
                return [3 /*break*/, 5];
            case 4:
                error_5 = _b.sent();
                res.status(500).json({ success: false, message: "Failed to update feedback", error: error_5 });
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.updateFeedback = updateFeedback;
