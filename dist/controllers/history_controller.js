"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFeedback = exports.clearHistory = exports.deleteDiagnosis = exports.getDiagnosisById = exports.getHistory = void 0;
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const mongoose_1 = __importDefault(require("mongoose"));
// @desc    Get user diagnosis logs (paginated)
// @route   GET /api/history
// @access  Private
const getHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cursor, limit, feedbackStatus } = req.query;
        const query = { user: userId };
        if (feedbackStatus) {
            query.feedbackStatus = feedbackStatus;
        }
        if (cursor) {
            const [diagnosedAtStr, idStr] = cursor.split("_");
            const cursorDate = new Date(parseInt(diagnosedAtStr, 10));
            query.$or = [
                { diagnosedAt: { $lt: cursorDate } },
                { diagnosedAt: cursorDate, _id: { $lt: new mongoose_1.default.Types.ObjectId(idStr) } }
            ];
        }
        const pageSize = limit ? parseInt(limit, 10) : 20;
        const history = await diagnosis_history_model_1.default.find(query)
            .sort({ diagnosedAt: -1, _id: -1 })
            .limit(pageSize + 1);
        const hasNextPage = history.length > pageSize;
        if (hasNextPage) {
            history.pop();
        }
        let endCursor = null;
        if (history.length > 0) {
            const lastItem = history[history.length - 1];
            endCursor = `${lastItem.diagnosedAt.getTime()}_${lastItem._id.toString()}`;
        }
        const formattedHistory = history.map(h => ({
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
        }));
        res.status(200).json({
            success: true,
            data: {
                items: formattedHistory,
                pageInfo: {
                    hasNextPage,
                    endCursor
                }
            },
            // legacy alias
            history: formattedHistory,
            count: formattedHistory.length
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch diagnosis logs", error });
    }
};
exports.getHistory = getHistory;
// @desc    Get a specific diagnosis log by ID
// @route   GET /api/history/:id
// @access  Private
const getDiagnosisById = async (req, res) => {
    try {
        const userId = req.user.id;
        const log = await diagnosis_history_model_1.default.findOne({ _id: req.params.id, user: userId });
        if (!log) {
            return res.status(404).json({ success: false, message: "Diagnosis log not found" });
        }
        res.status(200).json({
            success: true,
            data: { diagnosis: log }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to fetch log", error });
    }
};
exports.getDiagnosisById = getDiagnosisById;
// @desc    Delete a specific diagnosis log
// @route   DELETE /api/history/:id
// @access  Private
const deleteDiagnosis = async (req, res) => {
    try {
        const userId = req.user.id;
        const log = await diagnosis_history_model_1.default.findOneAndDelete({ _id: req.params.id, user: userId });
        if (!log) {
            return res.status(404).json({ success: false, message: "Diagnosis log not found or unauthorized" });
        }
        if (log.imagePublicId) {
            // Direct deletion without awaiting heavily or failing the request
            cloudinary_1.default.uploader.destroy(log.imagePublicId).catch(err => {
                console.error(`Failed to delete Cloudinary image ${log.imagePublicId}:`, err);
            });
        }
        res.status(200).json({
            success: true,
            data: { id: log._id },
            message: "Diagnosis log deleted successfully" // legacy
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete log", error });
    }
};
exports.deleteDiagnosis = deleteDiagnosis;
// @desc    Clear all user diagnosis history
// @route   DELETE /api/history
// @access  Private
const clearHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { before } = req.query;
        const query = { user: userId };
        if (before) {
            query.diagnosedAt = { $lt: new Date(before) };
        }
        // Fetch publicIds before deletion to clean up Cloudinary
        const logs = await diagnosis_history_model_1.default.find(query).select("imagePublicId");
        const deleteResult = await diagnosis_history_model_1.default.deleteMany(query);
        // Schedule Cloudinary deletions
        const publicIds = logs.map(l => l.imagePublicId).filter(id => id);
        if (publicIds.length > 0) {
            // Chunk deletions if too many, simple approach for now:
            Promise.all(publicIds.map(id => cloudinary_1.default.uploader.destroy(id))).catch(err => {
                console.error("Failed to delete some Cloudinary images during clearHistory:", err);
            });
        }
        res.status(200).json({
            success: true,
            data: { deletedCount: deleteResult.deletedCount },
            message: "Diagnosis history cleared successfully" // legacy
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to clear history", error });
    }
};
exports.clearHistory = clearHistory;
// @desc    Update user feedback status on a diagnosis
// @route   PUT /api/history/:id/feedback
// @access  Private
const updateFeedback = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, version } = req.body;
        const query = { _id: req.params.id, user: userId };
        if (version !== undefined) {
            query.version = version;
        }
        const log = await diagnosis_history_model_1.default.findOneAndUpdate(query, { $set: { feedbackStatus: status }, $inc: { version: 1 } }, { new: true });
        if (!log) {
            // Check if it exists at all to return 409 vs 404
            const existing = await diagnosis_history_model_1.default.findOne({ _id: req.params.id, user: userId });
            if (existing) {
                return res.status(409).json({ success: false, message: "Conflict: The record has been modified by another request." });
            }
            return res.status(404).json({ success: false, message: "Diagnosis record not found" });
        }
        res.status(200).json({
            success: true,
            data: {
                feedbackStatus: log.feedbackStatus,
                version: log.version,
            },
            message: `Feedback status updated to ${status}`, // legacy
            feedbackStatus: log.feedbackStatus, // legacy
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: "Failed to update feedback", error });
    }
};
exports.updateFeedback = updateFeedback;
