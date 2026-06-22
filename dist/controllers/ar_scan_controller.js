"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createArScanSession = exports.getArScanSessions = void 0;
const ar_scan_session_model_1 = __importDefault(require("../models/ar_scan_session_model"));
const toSessionPayload = (session) => ({
    id: session._id,
    mode: session.mode,
    label: session.label,
    plantId: session.plantId,
    createdAt: session.createdAt,
});
// @desc    Get AR scan sessions of current user
// @route   GET /api/explore/ar-scan-sessions
// @access  Private
const getArScanSessions = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cursor, limit, mode } = req.query;
        const plantId = req.params.plantId;
        const pageSize = Math.min(parseInt(limit) || 20, 50);
        const query = { user: userId };
        if (plantId)
            query.plantId = plantId;
        if (mode)
            query.mode = mode;
        if (cursor)
            query._id = { $lt: cursor };
        const items = await ar_scan_session_model_1.default.find(query).sort({ _id: -1 }).limit(pageSize + 1);
        const hasNext = items.length > pageSize;
        const results = hasNext ? items.slice(0, pageSize) : items;
        const nextCursor = hasNext ? results[results.length - 1]._id : null;
        const payload = { items: results.map(toSessionPayload), pageInfo: { nextCursor, limit: pageSize } };
        return res.status(200).json({ success: true, data: payload });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch AR scan sessions" });
    }
};
exports.getArScanSessions = getArScanSessions;
// @desc    Create AR scan session
// @route   POST /api/explore/ar-scan-sessions
// @access  Private
const createArScanSession = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mode, label, clientOperationId, deviceModel, appVersion, modelId, confidence, plantId } = req.body;
        if (!mode || !label) {
            return res.status(400).json({ success: false, message: "mode and label are required" });
        }
        const created = await ar_scan_session_model_1.default.create({
            user: userId,
            mode: String(mode).trim(),
            label: String(label).trim(),
            clientOperationId: clientOperationId ? String(clientOperationId).trim() : undefined,
            deviceModel: deviceModel ? String(deviceModel).trim() : undefined,
            appVersion: appVersion ? String(appVersion).trim() : undefined,
            modelId: modelId ? String(modelId).trim() : undefined,
            confidence: confidence !== undefined ? Number(confidence) : undefined,
            plantId: plantId || undefined,
        }).catch((err) => {
            if (err.code === 11000)
                throw { status: 409, code: "CONFLICT", message: "Duplicate operation" };
            throw err;
        });
        return res.status(201).json({ success: true, data: toSessionPayload(created) });
    }
    catch (error) {
        if (error.status === 409)
            return res.status(409).json({ success: false, code: "CONFLICT", message: error.message });
        return res.status(500).json({ success: false, message: "Failed to create AR scan session" });
    }
};
exports.createArScanSession = createArScanSession;
