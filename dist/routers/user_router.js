"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const validate_request_middleware_1 = require("../middlewares/validate_request_middleware");
const user_schemas_1 = require("../validation/user_schemas");
const router = (0, express_1.Router)();
router.get("/", auth_middleware_1.protect, auth_middleware_1.admin, user_controller_1.getAllUsers);
router.get("/me", auth_middleware_1.protect, user_controller_1.getCurrentUser);
router.put("/profile", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(user_schemas_1.updateProfileSchema), user_controller_1.updateProfile);
router.put("/change-password", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(user_schemas_1.changePasswordSchema), user_controller_1.changePassword);
router.put("/fcm-token", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(user_schemas_1.updateFcmTokenSchema), user_controller_1.updateFcmToken);
// Admin/Moderator dashboard endpoints
router.get("/dashboard-stats", auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)('moderator', 'admin', 'super_admin'), user_controller_1.getDashboardStats);
router.get("/:id/details", auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)('moderator', 'admin', 'super_admin'), user_controller_1.getUserDetails);
// Super Admin / Admin endpoints
router.put("/:id/role", auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)('admin', 'super_admin'), (0, validate_request_middleware_1.validateRequest)(user_schemas_1.updateUserRoleSchema), user_controller_1.updateUserRole);
router.delete("/:id", auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)('admin', 'super_admin'), user_controller_1.deleteUser);
exports.default = router;
