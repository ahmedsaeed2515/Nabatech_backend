"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const validate_request_middleware_1 = require("../middlewares/validate_request_middleware");
const community_schemas_1 = require("../validation/community_schemas");
const admin_community_controller_1 = require("../controllers/admin_community_controller");
const app_error_1 = require("../utils/app_error");
const router = (0, express_1.Router)();
// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.accountType === 'admin') {
        next();
    }
    else {
        next(new app_error_1.AppError({ message: 'Admin access required', statusCode: 403, code: 'AUTH_FORBIDDEN' }));
    }
};
router.get('/posts', auth_middleware_1.protect, requireAdmin, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.adminCommunityQuerySchema), admin_community_controller_1.adminGetPosts);
router.patch('/posts/:id/moderation', auth_middleware_1.protect, requireAdmin, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.adminModerationSchema), admin_community_controller_1.adminModeratePost);
router.get('/comments', auth_middleware_1.protect, requireAdmin, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.adminCommunityQuerySchema), admin_community_controller_1.adminGetComments);
router.patch('/comments/:id/moderation', auth_middleware_1.protect, requireAdmin, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.adminModerationSchema), admin_community_controller_1.adminModerateComment);
exports.default = router;
