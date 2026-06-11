import { Router } from 'express';
import { 
  registerUser, 
  loginUser, 
  forgotPassword, 
  resetPassword, 
  refreshAccessToken, 
  logoutUser, 
  logoutAll,
  verifyEmail, 
  resendVerification 
} from '../controllers/auth_controller';
import { protect } from '../middlewares/auth_middleware';
import { validateRequest } from '../middlewares/validate_request_middleware';
import { 
  loginLimiter, 
  registerLimiter, 
  strictAuthLimiter, 
  refreshLimiter 
} from '../middlewares/rate_limit_middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  logoutSchema,
  resendVerificationSchema
} from '../validation/auth_schemas';

const router = Router();

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
router.post('/register', registerLimiter, validateRequest(registerSchema), registerUser);

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
router.post('/login', loginLimiter, validateRequest(loginSchema), loginUser);

router.post('/forgot-password', strictAuthLimiter, validateRequest(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', strictAuthLimiter, validateRequest(resetPasswordSchema), resetPassword);
router.post('/refresh-token', refreshLimiter, validateRequest(refreshTokenSchema), refreshAccessToken);
router.get('/verify-email/:token', strictAuthLimiter, verifyEmail);
router.post('/resend-verification', strictAuthLimiter, validateRequest(resendVerificationSchema), resendVerification);
router.post('/logout', protect, validateRequest(logoutSchema), logoutUser);
router.post('/logout-all', protect, logoutAll);

export default router;
