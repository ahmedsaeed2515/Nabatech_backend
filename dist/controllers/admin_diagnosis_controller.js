"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminDiagnosisAnalytics = exports.getAdminDiagnoses = void 0;
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
// @desc    Get paginated diagnosis list for admins
// @route   GET /api/admin/diagnoses
// @access  Private/Admin
const getAdminDiagnoses = async (req, res) => {
    try {
        const { page, limit, from, to, severity, feedbackStatus } = req.query;
        const pageNum = parseInt(page) || 1;
        const pageSize = parseInt(limit) || 20;
        const skip = (pageNum - 1) * pageSize;
        const query = {};
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
        const items = await diagnosis_history_model_1.default.find(query)
            .sort({ diagnosedAt: -1, _id: -1 })
            .skip(skip)
            .limit(pageSize);
        const total = await diagnosis_history_model_1.default.countDocuments(query);
        const totalPages = Math.ceil(total / pageSize);
        res.status(200).json({
            success: true,
            data: {
                items,
                total,
                page: pageNum,
                totalPages
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch admin diagnoses", error });
    }
};
exports.getAdminDiagnoses = getAdminDiagnoses;
// @desc    Get diagnosis analytics
// @route   GET /api/admin/diagnoses/analytics
// @access  Private/Admin
const getAdminDiagnosisAnalytics = async (req, res) => {
    try {
        const { from, to, timeZone } = req.query;
        const query = {};
        if (from || to) {
            query.diagnosedAt = {};
            if (from)
                query.diagnosedAt.$gte = new Date(from);
            if (to)
                query.diagnosedAt.$lte = new Date(to);
        }
        const tz = timeZone || "UTC";
        const totalDiagnoses = await diagnosis_history_model_1.default.countDocuments(query);
        const bySeverity = await diagnosis_history_model_1.default.aggregate([
            { $match: query },
            { $group: { _id: "$severity", count: { $sum: 1 } } }
        ]);
        const topDiseases = await diagnosis_history_model_1.default.aggregate([
            { $match: query },
            { $group: { _id: "$diseaseNameEn", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        const byDay = await diagnosis_history_model_1.default.aggregate([
            { $match: query },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$diagnosedAt", timezone: tz } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);
        const totalOfflineScans = await diagnosis_history_model_1.default.countDocuments({ ...query, isOffline: true });
        const totalRemoteScans = await diagnosis_history_model_1.default.countDocuments({ ...query, isOffline: false });
        res.status(200).json({
            success: true,
            data: {
                totals: totalDiagnoses,
                byDay: byDay.map(d => ({ date: d._id, count: d.count })),
                bySeverity: bySeverity.map(s => ({ severity: s._id, count: s.count })),
                topDiseases: topDiseases.map(d => ({ name: d._id || "Healthy", count: d.count })),
                offlineVsRemote: {
                    offline: totalOfflineScans,
                    remote: totalRemoteScans
                }
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch analytics", error });
    }
};
exports.getAdminDiagnosisAnalytics = getAdminDiagnosisAnalytics;
