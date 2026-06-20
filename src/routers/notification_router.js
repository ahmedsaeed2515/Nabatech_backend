"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var notification_controller_1 = require("../controllers/notification_controller");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var router = (0, express_1.Router)();
// Apply auth middleware to all notification routes
router.use(auth_middleware_1.protect);
router.get('/', notification_controller_1.getNotifications);
router.get('/unread-count', notification_controller_1.getUnreadCount);
router.put('/read-all', notification_controller_1.markAllAsRead);
router.put('/:id/read', notification_controller_1.markAsRead);
router.delete('/:id', notification_controller_1.deleteNotification);
exports.default = router;
