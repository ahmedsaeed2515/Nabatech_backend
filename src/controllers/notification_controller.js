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
exports.deleteNotification = exports.markAllAsRead = exports.markAsRead = exports.getUnreadCount = exports.getNotifications = void 0;
var notification_model_1 = __importDefault(require("../models/notification_model"));
var mongoose_1 = __importDefault(require("mongoose"));
/**
 * GET /api/notifications
 * Returns paginated notifications for the authenticated user
 */
var getNotifications = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, page, limit, skip, _a, notifications, total, formattedNotifications, err_1;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                userId = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || req.userId;
                if (!userId)
                    return [2 /*return*/, res.status(401).json({ success: false, message: 'Unauthorized' })];
                page = Math.max(1, parseInt(req.query.page) || 1);
                limit = Math.min(50, parseInt(req.query.limit) || 20);
                skip = (page - 1) * limit;
                return [4 /*yield*/, Promise.all([
                        notification_model_1.default.find({ user: userId })
                            .sort({ createdAt: -1 })
                            .skip(skip)
                            .limit(limit)
                            .lean(),
                        notification_model_1.default.countDocuments({ user: userId })
                    ])];
            case 1:
                _a = _c.sent(), notifications = _a[0], total = _a[1];
                formattedNotifications = notifications.map(function (n) {
                    var mappedType = 'system';
                    var t = (n.type || '').toUpperCase();
                    if (t.includes('REMINDER'))
                        mappedType = 'reminder';
                    else if (t.includes('ALERT'))
                        mappedType = 'alert';
                    else if (t.includes('COMMUNITY'))
                        mappedType = 'community';
                    return {
                        id: n._id,
                        titleAr: n.titleAr || n.title,
                        titleEn: n.titleEn || n.title,
                        bodyAr: n.bodyAr || n.body,
                        bodyEn: n.bodyEn || n.body,
                        type: mappedType,
                        isRead: n.read,
                        createdAt: n.createdAt,
                        updatedAt: n.updatedAt,
                        data: n.data
                    };
                });
                return [2 /*return*/, res.json({
                        success: true,
                        data: formattedNotifications,
                        pagination: { page: page, limit: limit, total: total, pages: Math.ceil(total / limit) }
                    })];
            case 2:
                err_1 = _c.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: err_1.message })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getNotifications = getNotifications;
/**
 * GET /api/notifications/unread-count
 * Returns count of unread notifications for badge display
 */
var getUnreadCount = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, count, err_2;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.userId;
                if (!userId)
                    return [2 /*return*/, res.status(401).json({ success: false, message: 'Unauthorized' })];
                return [4 /*yield*/, notification_model_1.default.countDocuments({ user: userId, read: false })];
            case 1:
                count = _b.sent();
                return [2 /*return*/, res.json({ success: true, count: count })];
            case 2:
                err_2 = _b.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: err_2.message })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getUnreadCount = getUnreadCount;
/**
 * PUT /api/notifications/:id/read
 * Mark a single notification as read
 */
var markAsRead = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, notification, err_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.userId;
                if (!userId)
                    return [2 /*return*/, res.status(401).json({ success: false, message: 'Unauthorized' })];
                if (!mongoose_1.default.isValidObjectId(req.params.id)) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Invalid notification ID' })];
                }
                return [4 /*yield*/, notification_model_1.default.findOneAndUpdate({ _id: req.params.id, user: userId }, { read: true }, { new: true })];
            case 1:
                notification = _b.sent();
                if (!notification) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: 'Notification not found' })];
                }
                return [2 /*return*/, res.json({ success: true, data: notification })];
            case 2:
                err_3 = _b.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: err_3.message })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.markAsRead = markAsRead;
/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
var markAllAsRead = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, err_4;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.userId;
                if (!userId)
                    return [2 /*return*/, res.status(401).json({ success: false, message: 'Unauthorized' })];
                return [4 /*yield*/, notification_model_1.default.updateMany({ user: userId, read: false }, { read: true })];
            case 1:
                _b.sent();
                return [2 /*return*/, res.json({ success: true, message: 'All notifications marked as read' })];
            case 2:
                err_4 = _b.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: err_4.message })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.markAllAsRead = markAllAsRead;
/**
 * DELETE /api/notifications/:id
 * Delete a single notification
 */
var deleteNotification = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, err_5;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = ((_a = req.user) === null || _a === void 0 ? void 0 : _a.id) || req.userId;
                if (!userId)
                    return [2 /*return*/, res.status(401).json({ success: false, message: 'Unauthorized' })];
                if (!mongoose_1.default.isValidObjectId(req.params.id)) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Invalid notification ID' })];
                }
                return [4 /*yield*/, notification_model_1.default.findOneAndDelete({ _id: req.params.id, user: userId })];
            case 1:
                _b.sent();
                return [2 /*return*/, res.json({ success: true, message: 'Notification deleted' })];
            case 2:
                err_5 = _b.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: err_5.message })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteNotification = deleteNotification;
