"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_controller_1 = require("../controllers/auth_controller");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var validate_request_middleware_1 = require("../middlewares/validate_request_middleware");
var rate_limit_middleware_1 = require("../middlewares/rate_limit_middleware");
var auth_schemas_1 = require("../validation/auth_schemas");
var router = (0, express_1.Router)();
/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 */
router.post('/register', rate_limit_middleware_1.registerLimiter, (0, validate_request_middleware_1.validateRequest)(auth_schemas_1.registerSchema), auth_controller_1.registerUser);
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User login successfully
 */
router.post('/login', rate_limit_middleware_1.loginLimiter, (0, validate_request_middleware_1.validateRequest)(auth_schemas_1.loginSchema), auth_controller_1.loginUser);
router.post('/forgot-password', rate_limit_middleware_1.strictAuthLimiter, (0, validate_request_middleware_1.validateRequest)(auth_schemas_1.forgotPasswordSchema), auth_controller_1.forgotPassword);
router.post('/reset-password', rate_limit_middleware_1.strictAuthLimiter, (0, validate_request_middleware_1.validateRequest)(auth_schemas_1.resetPasswordSchema), auth_controller_1.resetPassword);
router.post('/refresh-token', rate_limit_middleware_1.refreshLimiter, (0, validate_request_middleware_1.validateRequest)(auth_schemas_1.refreshTokenSchema), auth_controller_1.refreshAccessToken);
router.get('/verify-email/:token', rate_limit_middleware_1.strictAuthLimiter, auth_controller_1.verifyEmail);
router.post('/resend-verification', rate_limit_middleware_1.strictAuthLimiter, (0, validate_request_middleware_1.validateRequest)(auth_schemas_1.resendVerificationSchema), auth_controller_1.resendVerification);
router.post('/logout', auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(auth_schemas_1.logoutSchema), auth_controller_1.logoutUser);
router.post('/logout-all', auth_middleware_1.protect, auth_controller_1.logoutAll);
exports.default = router;
