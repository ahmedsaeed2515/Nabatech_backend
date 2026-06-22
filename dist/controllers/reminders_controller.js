"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminStats = exports.getAdminReminders = exports.deleteReminder = exports.updateReminder = exports.createReminder = exports.getReminders = void 0;
const reminder_model_1 = __importDefault(require("../models/reminder_model"));
const reminder_schemas_1 = require("../validation/reminder_schemas");
// @desc    Get all reminders of the user
// @route   GET /api/reminders
// @access  Private
const getReminders = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cursor, limit, enabled } = req.query;
        const queryLimit = Math.min(parseInt(limit) || 50, 50);
        const query = { user: userId };
        if (enabled !== undefined) {
            query.enabled = enabled === 'true';
        }
        if (cursor) {
            query._id = { $lt: cursor }; // Cursor pagination descending
        }
        const reminders = await reminder_model_1.default.find(query)
            .sort({ _id: -1 })
            .limit(queryLimit + 1)
            .populate('plantId', 'name');
        const hasNextPage = reminders.length > queryLimit;
        if (hasNextPage)
            reminders.pop();
        const nextCursor = hasNextPage ? reminders[reminders.length - 1]._id : null;
        res.status(200).json({
            data: {
                items: reminders.map(r => ({
                    id: r._id,
                    title: r.title,
                    plantId: r.plantId?._id || r.plantId,
                    plantName: r.plantId?.name || 'Unknown Plant',
                    timeLabel: r.timeLabel,
                    iconCodePoint: r.iconCodePoint,
                    enabled: r.enabled,
                    scheduledAt: r.scheduledAt,
                    timeZone: r.timeZone,
                    recurrence: r.recurrence,
                    clientOperationId: r.clientOperationId,
                    version: r.version,
                    createdAt: r.createdAt,
                })),
                pageInfo: {
                    hasNextPage,
                    nextCursor
                }
            },
            // Legacy backward compatibility
            success: true,
            count: reminders.length,
            reminders: reminders.map(r => ({
                id: r._id,
                title: r.title,
                plantId: r.plantId?._id || r.plantId,
                plantName: r.plantId?.name || 'Unknown Plant',
                timeLabel: r.timeLabel,
                iconCodePoint: r.iconCodePoint,
                enabled: r.enabled,
                createdAt: r.createdAt,
            })),
        });
    }
    catch (error) {
        console.error("getReminders Error:", error);
        res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to fetch reminders" });
    }
};
exports.getReminders = getReminders;
// @desc    Create a reminder
// @route   POST /api/reminders
// @access  Private
const createReminder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, plantId, timeLabel, iconCodePoint, enabled, scheduledAt, timeZone, recurrence, clientOperationId } = req.body;
        if (!title || !plantId) {
            return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Title and plantId are required" });
        }
        if (scheduledAt && !(0, reminder_schemas_1.validateIsoDate)(scheduledAt)) {
            return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid ISO date for scheduledAt" });
        }
        if (timeZone && !(0, reminder_schemas_1.validateTimeZone)(timeZone)) {
            return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid IANA timeZone" });
        }
        if (recurrence && !(0, reminder_schemas_1.validateRecurrence)(recurrence)) {
            return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid recurrence value" });
        }
        const reminder = new reminder_model_1.default({
            user: userId,
            title: title.trim(),
            plantId: plantId,
            timeLabel: timeLabel ? timeLabel.trim() : (scheduledAt ? new Date(scheduledAt).toLocaleTimeString() : 'Review Needed'),
            iconCodePoint: iconCodePoint !== undefined ? Number(iconCodePoint) : undefined,
            enabled: enabled !== undefined ? Boolean(enabled) : true,
            scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
            timeZone: timeZone || undefined,
            recurrence: recurrence || undefined,
            clientOperationId: clientOperationId || undefined,
            version: 0,
        });
        try {
            await reminder.save();
            console.info(JSON.stringify({ event: 'reminders.event', action: 'create', actorId: userId, targetId: reminder._id, result: 'success' }));
        }
        catch (err) {
            if (err.code === 11000 && clientOperationId) {
                // Idempotency conflict
                return res.status(409).json({ errorCode: "CONFLICT", message: "Duplicate clientOperationId" });
            }
            throw err;
        }
        const responsePayload = {
            id: reminder._id,
            title: reminder.title,
            plantId: reminder.plantId,
            plantName: req.body.plantName || 'Unknown Plant',
            timeLabel: reminder.timeLabel,
            iconCodePoint: reminder.iconCodePoint,
            enabled: reminder.enabled,
            scheduledAt: reminder.scheduledAt,
            timeZone: reminder.timeZone,
            recurrence: reminder.recurrence,
            clientOperationId: reminder.clientOperationId,
            version: reminder.version,
            createdAt: reminder.createdAt,
        };
        res.status(201).json({
            data: { reminder: responsePayload },
            success: true,
            reminder: responsePayload
        });
    }
    catch (error) {
        console.error("createReminder Error:", error);
        res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to create reminder" });
    }
};
exports.createReminder = createReminder;
// @desc    Update a reminder
// @route   PUT /api/reminders/:id
// @access  Private
const updateReminder = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, plantId, timeLabel, iconCodePoint, enabled, scheduledAt, timeZone, recurrence, version } = req.body;
        const reminder = await reminder_model_1.default.findOne({ _id: req.params.id, user: userId });
        if (!reminder) {
            return res.status(404).json({ errorCode: "RESOURCE_NOT_FOUND", message: "Reminder not found" });
        }
        if (version !== undefined && version !== reminder.version) {
            return res.status(409).json({ errorCode: "CONFLICT", message: "Optimistic concurrency conflict: version mismatch" });
        }
        if (scheduledAt && !(0, reminder_schemas_1.validateIsoDate)(scheduledAt)) {
            return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid ISO date for scheduledAt" });
        }
        if (timeZone && !(0, reminder_schemas_1.validateTimeZone)(timeZone)) {
            return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid IANA timeZone" });
        }
        if (recurrence && !(0, reminder_schemas_1.validateRecurrence)(recurrence)) {
            return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid recurrence value" });
        }
        if (title !== undefined)
            reminder.title = title.trim();
        if (plantId !== undefined)
            reminder.plantId = plantId;
        if (timeLabel !== undefined)
            reminder.timeLabel = timeLabel.trim();
        if (iconCodePoint !== undefined)
            reminder.iconCodePoint = Number(iconCodePoint);
        if (enabled !== undefined)
            reminder.enabled = Boolean(enabled);
        if (scheduledAt !== undefined)
            reminder.scheduledAt = scheduledAt ? new Date(scheduledAt) : undefined;
        if (timeZone !== undefined)
            reminder.timeZone = timeZone || undefined;
        if (recurrence !== undefined)
            reminder.recurrence = recurrence || undefined;
        reminder.version += 1;
        await reminder.save();
        console.info(JSON.stringify({ event: 'reminders.event', action: 'update', actorId: userId, targetId: reminder._id, result: 'success' }));
        const responsePayload = {
            id: reminder._id,
            title: reminder.title,
            plantId: reminder.plantId,
            plantName: req.body.plantName || 'Unknown Plant',
            timeLabel: reminder.timeLabel,
            iconCodePoint: reminder.iconCodePoint,
            enabled: reminder.enabled,
            scheduledAt: reminder.scheduledAt,
            timeZone: reminder.timeZone,
            recurrence: reminder.recurrence,
            clientOperationId: reminder.clientOperationId,
            version: reminder.version,
            createdAt: reminder.createdAt,
        };
        res.status(200).json({
            data: { reminder: responsePayload },
            success: true,
            reminder: responsePayload
        });
    }
    catch (error) {
        console.error("updateReminder Error:", error);
        res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to update reminder" });
    }
};
exports.updateReminder = updateReminder;
// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
const deleteReminder = async (req, res) => {
    try {
        const userId = req.user.id;
        const reminder = await reminder_model_1.default.findOneAndDelete({ _id: req.params.id, user: userId });
        if (!reminder) {
            return res.status(404).json({ errorCode: "RESOURCE_NOT_FOUND", message: "Reminder not found or unauthorized" });
        }
        console.info(JSON.stringify({ event: 'reminders.event', action: 'delete', actorId: userId, targetId: reminder._id, result: 'success' }));
        res.status(200).json({
            data: { id: reminder._id },
            success: true,
            message: "Reminder deleted successfully"
        });
    }
    catch (error) {
        console.error("deleteReminder Error:", error);
        res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to delete reminder" });
    }
};
exports.deleteReminder = deleteReminder;
// @desc    Admin: Get all reminders overview
// @route   GET /api/admin/reminders
// @access  Private/Admin
const getAdminReminders = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = Math.min(parseInt(req.query.limit) || 100, 100);
        const enabled = req.query.enabled;
        const skip = (page - 1) * limit;
        const query = {};
        if (enabled !== undefined)
            query.enabled = enabled === 'true';
        const [items, total] = await Promise.all([
            reminder_model_1.default.find(query).sort({ _id: -1 }).skip(skip).limit(limit),
            reminder_model_1.default.countDocuments(query)
        ]);
        res.status(200).json({
            data: {
                items,
                total,
                page,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error("getAdminReminders Error:", error);
        res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to fetch admin reminders" });
    }
};
exports.getAdminReminders = getAdminReminders;
// @desc    Admin: Get reminders stats
// @route   GET /api/admin/reminders/stats
// @access  Private/Admin
const getAdminStats = async (req, res) => {
    try {
        const { from, to, timeZone } = req.query;
        const query = {};
        if (from || to) {
            query.createdAt = {};
            if (from)
                query.createdAt.$gte = new Date(from);
            if (to)
                query.createdAt.$lte = new Date(to);
        }
        if (timeZone) {
            query.timeZone = timeZone;
        }
        const [total, enabled, disabled, byDayRaw] = await Promise.all([
            reminder_model_1.default.countDocuments(query),
            reminder_model_1.default.countDocuments({ ...query, enabled: true }),
            reminder_model_1.default.countDocuments({ ...query, enabled: false }),
            reminder_model_1.default.aggregate([
                { $match: query },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);
        const byDay = byDayRaw.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        res.status(200).json({
            data: {
                total,
                enabled,
                disabled,
                byDay
            }
        });
    }
    catch (error) {
        console.error("getAdminStats Error:", error);
        res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to fetch admin reminder stats" });
    }
};
exports.getAdminStats = getAdminStats;
