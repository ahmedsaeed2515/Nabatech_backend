"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var admin_tickets_controller_1 = require("../controllers/admin_tickets_controller");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var router = (0, express_1.Router)();
var adminOrMod = (0, auth_middleware_1.authorizeRoles)('moderator', 'admin', 'super_admin');
// All admin ticket routes are protected and restricted to staff roles
router.use(auth_middleware_1.protect, adminOrMod);
router.get("/", admin_tickets_controller_1.getAdminTickets);
router.get("/stats", admin_tickets_controller_1.getAdminTicketsStats);
router.get("/:id", admin_tickets_controller_1.getAdminTicketById);
router.post("/:id/reply", admin_tickets_controller_1.replyToTicket);
router.patch("/:id/status", admin_tickets_controller_1.updateTicketStatus);
router.patch("/:id/assign", admin_tickets_controller_1.assignTicket);
exports.default = router;
