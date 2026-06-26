"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const admin_users_controller_1 = require("../controllers/admin_users_controller");
const router = (0, express_1.Router)();
// Protect all routes and ensure at least 'admin' or 'super_admin' access
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.authorizeRoles)('admin', 'super_admin'));
// Route: /api/admin/users
router.route('/')
    .get(admin_users_controller_1.getUsers)
    .post(admin_users_controller_1.adminCreateUser);
// Route: /api/admin/users/bulk-action
router.post('/bulk-action', admin_users_controller_1.bulkAction);
// Route: /api/admin/users/:id/role
router.patch('/:id/role', admin_users_controller_1.updateUserRole);
// Route: /api/admin/users/:id/status
router.patch('/:id/status', admin_users_controller_1.updateUserStatus);
// Route: /api/admin/users/:id/restore
router.post('/:id/restore', admin_users_controller_1.restoreUser);
// Route: /api/admin/users/:id/moderation
router.patch('/:id/moderation', admin_users_controller_1.updateUserModeration);
// Route: /api/admin/users/:id
router.route('/:id')
    .get(admin_users_controller_1.getUserById)
    .delete(admin_users_controller_1.softDeleteUser);
exports.default = router;
