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
exports.getAdminDiagnosisAnalytics = exports.getAdminDiagnoses = void 0;
var diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
// @desc    Get paginated diagnosis list for admins
// @route   GET /api/admin/diagnoses
// @access  Private/Admin
var getAdminDiagnoses = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, page, limit, from, to, severity, feedbackStatus, pageNum, pageSize, skip, query, items, total, totalPages, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.query, page = _a.page, limit = _a.limit, from = _a.from, to = _a.to, severity = _a.severity, feedbackStatus = _a.feedbackStatus;
                pageNum = parseInt(page) || 1;
                pageSize = parseInt(limit) || 20;
                skip = (pageNum - 1) * pageSize;
                query = {};
                if (severity)
                    query.severity = severity;
                if (feedbackStatus)
                    query.feedbackStatus = feedbackStatus;
                if (from || to) {
                    query.diagnosedAt = {};
                    if (from)
                        query.diagnosedAt.$gte = new Date(from);
                    if (to)
                        query.diagnosedAt.$lte = new Date(to);
                }
                return [4 /*yield*/, diagnosis_history_model_1.default.find(query)
                        .sort({ diagnosedAt: -1, _id: -1 })
                        .skip(skip)
                        .limit(pageSize)];
            case 1:
                items = _b.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.countDocuments(query)];
            case 2:
                total = _b.sent();
                totalPages = Math.ceil(total / pageSize);
                res.status(200).json({
                    success: true,
                    data: {
                        items: items,
                        total: total,
                        page: pageNum,
                        totalPages: totalPages
                    }
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _b.sent();
                res.status(500).json({ success: false, message: "Failed to fetch admin diagnoses", error: error_1 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAdminDiagnoses = getAdminDiagnoses;
// @desc    Get diagnosis analytics
// @route   GET /api/admin/diagnoses/analytics
// @access  Private/Admin
var getAdminDiagnosisAnalytics = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, from, to, timeZone, query, tz, totalDiagnoses, bySeverity, topDiseases, byDay, totalOfflineScans, totalRemoteScans, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 7, , 8]);
                _a = req.query, from = _a.from, to = _a.to, timeZone = _a.timeZone;
                query = {};
                if (from || to) {
                    query.diagnosedAt = {};
                    if (from)
                        query.diagnosedAt.$gte = new Date(from);
                    if (to)
                        query.diagnosedAt.$lte = new Date(to);
                }
                tz = timeZone || "UTC";
                return [4 /*yield*/, diagnosis_history_model_1.default.countDocuments(query)];
            case 1:
                totalDiagnoses = _b.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.aggregate([
                        { $match: query },
                        { $group: { _id: "$severity", count: { $sum: 1 } } }
                    ])];
            case 2:
                bySeverity = _b.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.aggregate([
                        { $match: query },
                        { $group: { _id: "$diseaseNameEn", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 5 }
                    ])];
            case 3:
                topDiseases = _b.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.aggregate([
                        { $match: query },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$diagnosedAt", timezone: tz } },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ])];
            case 4:
                byDay = _b.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.countDocuments(__assign(__assign({}, query), { isOffline: true }))];
            case 5:
                totalOfflineScans = _b.sent();
                return [4 /*yield*/, diagnosis_history_model_1.default.countDocuments(__assign(__assign({}, query), { isOffline: false }))];
            case 6:
                totalRemoteScans = _b.sent();
                res.status(200).json({
                    success: true,
                    data: {
                        totals: totalDiagnoses,
                        byDay: byDay.map(function (d) { return ({ date: d._id, count: d.count }); }),
                        bySeverity: bySeverity.map(function (s) { return ({ severity: s._id, count: s.count }); }),
                        topDiseases: topDiseases.map(function (d) { return ({ name: d._id || "Healthy", count: d.count }); }),
                        offlineVsRemote: {
                            offline: totalOfflineScans,
                            remote: totalRemoteScans
                        }
                    }
                });
                return [3 /*break*/, 8];
            case 7:
                error_2 = _b.sent();
                res.status(500).json({ success: false, message: "Failed to fetch analytics", error: error_2 });
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.getAdminDiagnosisAnalytics = getAdminDiagnosisAnalytics;
