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
exports.getAdminStats = exports.getAdminReminders = exports.deleteReminder = exports.updateReminder = exports.createReminder = exports.getReminders = void 0;
var reminder_model_1 = __importDefault(require("../models/reminder_model"));
var reminder_schemas_1 = require("../validation/reminder_schemas");
// @desc    Get all reminders of the user
// @route   GET /api/reminders
// @access  Private
var getReminders = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, cursor, limit, enabled, queryLimit, query, reminders, hasNextPage, nextCursor, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = req.user.id;
                _a = req.query, cursor = _a.cursor, limit = _a.limit, enabled = _a.enabled;
                queryLimit = Math.min(parseInt(limit) || 50, 50);
                query = { user: userId };
                if (enabled !== undefined) {
                    query.enabled = enabled === 'true';
                }
                if (cursor) {
                    query._id = { $lt: cursor }; // Cursor pagination descending
                }
                return [4 /*yield*/, reminder_model_1.default.find(query)
                        .sort({ _id: -1 })
                        .limit(queryLimit + 1)];
            case 1:
                reminders = _b.sent();
                hasNextPage = reminders.length > queryLimit;
                if (hasNextPage)
                    reminders.pop();
                nextCursor = hasNextPage ? reminders[reminders.length - 1]._id : null;
                res.status(200).json({
                    data: {
                        items: reminders.map(function (r) { return ({
                            id: r._id,
                            title: r.title,
                            plantId: r.plantId,
                            timeLabel: r.timeLabel,
                            iconCodePoint: r.iconCodePoint,
                            enabled: r.enabled,
                            scheduledAt: r.scheduledAt,
                            timeZone: r.timeZone,
                            recurrence: r.recurrence,
                            clientOperationId: r.clientOperationId,
                            version: r.version,
                            createdAt: r.createdAt,
                        }); }),
                        pageInfo: {
                            hasNextPage: hasNextPage,
                            nextCursor: nextCursor
                        }
                    },
                    // Legacy backward compatibility
                    success: true,
                    count: reminders.length,
                    reminders: reminders.map(function (r) { return ({
                        id: r._id,
                        title: r.title,
                        plantId: r.plantId,
                        timeLabel: r.timeLabel,
                        iconCodePoint: r.iconCodePoint,
                        enabled: r.enabled,
                        createdAt: r.createdAt,
                    }); }),
                });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                console.error("getReminders Error:", error_1);
                res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to fetch reminders" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getReminders = getReminders;
// @desc    Create a reminder
// @route   POST /api/reminders
// @access  Private
var createReminder = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, title, plantId, timeLabel, iconCodePoint, enabled, scheduledAt, timeZone, recurrence, clientOperationId, reminder, err_1, responsePayload, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                userId = req.user.id;
                _a = req.body, title = _a.title, plantId = _a.plantId, timeLabel = _a.timeLabel, iconCodePoint = _a.iconCodePoint, enabled = _a.enabled, scheduledAt = _a.scheduledAt, timeZone = _a.timeZone, recurrence = _a.recurrence, clientOperationId = _a.clientOperationId;
                if (!title || !plantId) {
                    return [2 /*return*/, res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Title and plantId are required" })];
                }
                if (scheduledAt && !(0, reminder_schemas_1.validateIsoDate)(scheduledAt)) {
                    return [2 /*return*/, res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid ISO date for scheduledAt" })];
                }
                if (timeZone && !(0, reminder_schemas_1.validateTimeZone)(timeZone)) {
                    return [2 /*return*/, res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid IANA timeZone" })];
                }
                if (recurrence && !(0, reminder_schemas_1.validateRecurrence)(recurrence)) {
                    return [2 /*return*/, res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid recurrence value" })];
                }
                reminder = new reminder_model_1.default({
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
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                return [4 /*yield*/, reminder.save()];
            case 2:
                _b.sent();
                console.info(JSON.stringify({ event: 'reminders.event', action: 'create', actorId: userId, targetId: reminder._id, result: 'success' }));
                return [3 /*break*/, 4];
            case 3:
                err_1 = _b.sent();
                if (err_1.code === 11000 && clientOperationId) {
                    // Idempotency conflict
                    return [2 /*return*/, res.status(409).json({ errorCode: "CONFLICT", message: "Duplicate clientOperationId" })];
                }
                throw err_1;
            case 4:
                responsePayload = {
                    id: reminder._id,
                    title: reminder.title,
                    plantId: reminder.plantId,
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
                return [3 /*break*/, 6];
            case 5:
                error_2 = _b.sent();
                console.error("createReminder Error:", error_2);
                res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to create reminder" });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.createReminder = createReminder;
// @desc    Update a reminder
// @route   PUT /api/reminders/:id
// @access  Private
var updateReminder = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, title, plantId, timeLabel, iconCodePoint, enabled, scheduledAt, timeZone, recurrence, version, reminder, responsePayload, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = req.user.id;
                _a = req.body, title = _a.title, plantId = _a.plantId, timeLabel = _a.timeLabel, iconCodePoint = _a.iconCodePoint, enabled = _a.enabled, scheduledAt = _a.scheduledAt, timeZone = _a.timeZone, recurrence = _a.recurrence, version = _a.version;
                return [4 /*yield*/, reminder_model_1.default.findOne({ _id: req.params.id, user: userId })];
            case 1:
                reminder = _b.sent();
                if (!reminder) {
                    return [2 /*return*/, res.status(404).json({ errorCode: "RESOURCE_NOT_FOUND", message: "Reminder not found" })];
                }
                if (version !== undefined && version !== reminder.version) {
                    return [2 /*return*/, res.status(409).json({ errorCode: "CONFLICT", message: "Optimistic concurrency conflict: version mismatch" })];
                }
                if (scheduledAt && !(0, reminder_schemas_1.validateIsoDate)(scheduledAt)) {
                    return [2 /*return*/, res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid ISO date for scheduledAt" })];
                }
                if (timeZone && !(0, reminder_schemas_1.validateTimeZone)(timeZone)) {
                    return [2 /*return*/, res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid IANA timeZone" })];
                }
                if (recurrence && !(0, reminder_schemas_1.validateRecurrence)(recurrence)) {
                    return [2 /*return*/, res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid recurrence value" })];
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
                return [4 /*yield*/, reminder.save()];
            case 2:
                _b.sent();
                console.info(JSON.stringify({ event: 'reminders.event', action: 'update', actorId: userId, targetId: reminder._id, result: 'success' }));
                responsePayload = {
                    id: reminder._id,
                    title: reminder.title,
                    plantId: reminder.plantId,
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
                return [3 /*break*/, 4];
            case 3:
                error_3 = _b.sent();
                console.error("updateReminder Error:", error_3);
                res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to update reminder" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateReminder = updateReminder;
// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
var deleteReminder = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, reminder, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                return [4 /*yield*/, reminder_model_1.default.findOneAndDelete({ _id: req.params.id, user: userId })];
            case 1:
                reminder = _a.sent();
                if (!reminder) {
                    return [2 /*return*/, res.status(404).json({ errorCode: "RESOURCE_NOT_FOUND", message: "Reminder not found or unauthorized" })];
                }
                console.info(JSON.stringify({ event: 'reminders.event', action: 'delete', actorId: userId, targetId: reminder._id, result: 'success' }));
                res.status(200).json({
                    data: { id: reminder._id },
                    success: true,
                    message: "Reminder deleted successfully"
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _a.sent();
                console.error("deleteReminder Error:", error_4);
                res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to delete reminder" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteReminder = deleteReminder;
// @desc    Admin: Get all reminders overview
// @route   GET /api/admin/reminders
// @access  Private/Admin
var getAdminReminders = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, enabled, skip, query, _a, items, total, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                page = parseInt(req.query.page) || 1;
                limit = Math.min(parseInt(req.query.limit) || 100, 100);
                enabled = req.query.enabled;
                skip = (page - 1) * limit;
                query = {};
                if (enabled !== undefined)
                    query.enabled = enabled === 'true';
                return [4 /*yield*/, Promise.all([
                        reminder_model_1.default.find(query).sort({ _id: -1 }).skip(skip).limit(limit),
                        reminder_model_1.default.countDocuments(query)
                    ])];
            case 1:
                _a = _b.sent(), items = _a[0], total = _a[1];
                res.status(200).json({
                    data: {
                        items: items,
                        total: total,
                        page: page,
                        totalPages: Math.ceil(total / limit)
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _b.sent();
                console.error("getAdminReminders Error:", error_5);
                res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to fetch admin reminders" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAdminReminders = getAdminReminders;
// @desc    Admin: Get reminders stats
// @route   GET /api/admin/reminders/stats
// @access  Private/Admin
var getAdminStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, from, to, timeZone, query, _b, total, enabled, disabled, byDayRaw, byDay, error_6;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.query, from = _a.from, to = _a.to, timeZone = _a.timeZone;
                query = {};
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
                return [4 /*yield*/, Promise.all([
                        reminder_model_1.default.countDocuments(query),
                        reminder_model_1.default.countDocuments(__assign(__assign({}, query), { enabled: true })),
                        reminder_model_1.default.countDocuments(__assign(__assign({}, query), { enabled: false })),
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
                    ])];
            case 1:
                _b = _c.sent(), total = _b[0], enabled = _b[1], disabled = _b[2], byDayRaw = _b[3];
                byDay = byDayRaw.reduce(function (acc, curr) {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {});
                res.status(200).json({
                    data: {
                        total: total,
                        enabled: enabled,
                        disabled: disabled,
                        byDay: byDay
                    }
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _c.sent();
                console.error("getAdminStats Error:", error_6);
                res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to fetch admin reminder stats" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAdminStats = getAdminStats;
