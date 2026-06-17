"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resendVerification = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.logoutAll = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.registerUser = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_model_1 = __importDefault(require("../models/user_model"));
const password_reset_request_model_1 = __importDefault(require("../models/password_reset_request_model"));
const refresh_session_model_1 = __importDefault(require("../models/refresh_session_model"));
const outbox_job_model_1 = __importDefault(require("../models/outbox_job_model"));
const generateToken_1 = require("../utils/generateToken");
const app_error_1 = require("../utils/app_error");
const api_response_1 = require("../utils/api_response");
const env_1 = require("../config/env");
const logger_1 = require("../utils/logger");
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { name, email, password, phoneNumber } = req.body;
        const userExists = await user_model_1.default.findOne({ email }).session(session);
        if (userExists) {
            throw new app_error_1.AppError({ code: 'AUTH_EMAIL_EXISTS', statusCode: 400, message: 'User already exists' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const emailVerificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const emailVerificationTokenHash = (0, generateToken_1.hashToken)(emailVerificationToken);
        const user = new user_model_1.default({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            emailVerificationTokenHash,
            emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
        });
        // Create Outbox Job for Email
        const outboxJob = new outbox_job_model_1.default({
            type: 'email_verification',
            aggregateId: user._id.toString(),
            idempotencyKey: `email-verify:${user._id}:1`,
            payload: { email: user.email, token: emailVerificationToken }
        });
        await user.save({ session });
        await outboxJob.save({ session });
        // Generate tokens
        const accessToken = (0, generateToken_1.generateAccessToken)(user._id.toString(), user.role || 'user', user.tokenVersion);
        const { token: refreshToken, jti } = (0, generateToken_1.generateRefreshToken)(user._id.toString());
        const refreshTokenHash = (0, generateToken_1.hashToken)(refreshToken);
        // Legacy support fallback
        // user.refreshToken = refreshToken; // Removed
        // user.emailVerificationToken = emailVerificationToken; // Removed
        await user.save({ session });
        // Store secure refresh session
        const refreshSession = new refresh_session_model_1.default({
            user: user._id,
            tokenHash: refreshTokenHash,
            familyId: jti,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        await refreshSession.save({ session });
        await session.commitTransaction();
        logger_1.logger.info('auth.login.success', { userId: user._id, action: 'register' });
        const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
        };
        return (0, api_response_1.created)(res, { accessToken, refreshToken, user: userData }, { token: accessToken, refreshToken, user: userData });
    }
    catch (error) {
        await session.abortTransaction();
        next(error);
    }
    finally {
        session.endSession();
    }
};
exports.registerUser = registerUser;
// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
    try {
        const { email, password, deviceId } = req.body;
        const user = await user_model_1.default.findOne({ email });
        if (!user) {
            logger_1.logger.info('auth.login.failed', { email, reason: 'not_found' });
            throw new app_error_1.AppError({ code: 'AUTH_INVALID_CREDENTIALS', statusCode: 401, message: 'Invalid email or password' });
        }
        if (user.status === 'disabled') {
            logger_1.logger.info('auth.login.failed', { userId: user._id, reason: 'disabled' });
            throw new app_error_1.AppError({ code: 'AUTH_ACCOUNT_DISABLED', statusCode: 403, message: 'Account is disabled' });
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            logger_1.logger.info('auth.login.failed', { userId: user._id, reason: 'bad_password' });
            throw new app_error_1.AppError({ code: 'AUTH_INVALID_CREDENTIALS', statusCode: 401, message: 'Invalid email or password' });
        }
        const accessToken = (0, generateToken_1.generateAccessToken)(user._id.toString(), user.role || 'user', user.tokenVersion);
        const { token: refreshToken, jti } = (0, generateToken_1.generateRefreshToken)(user._id.toString());
        const refreshTokenHash = (0, generateToken_1.hashToken)(refreshToken);
        const refreshSession = new refresh_session_model_1.default({
            user: user._id,
            tokenHash: refreshTokenHash,
            familyId: jti,
            deviceId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        // Legacy support
        // user.refreshToken = refreshToken; // Removed
        await user.save();
        await refreshSession.save();
        logger_1.logger.info('auth.login.success', { userId: user._id, deviceId });
        const userData = {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role,
            phoneNumber: user.phoneNumber || "",
            avatarUrl: user.avatarUrl || "",
            createdAt: user.createdAt.toISOString(),
        };
        return (0, api_response_1.ok)(res, { accessToken, refreshToken, user: userData }, { token: accessToken, refreshToken, user: userData });
    }
    catch (error) {
        next(error);
    }
};
exports.loginUser = loginUser;
// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshAccessToken = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { refreshToken, deviceId } = req.body;
        let decoded;
        try {
            decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
        }
        catch (err) {
            throw new app_error_1.AppError({ code: 'AUTH_REFRESH_EXPIRED', statusCode: 401, message: 'Invalid or expired refresh token' });
        }
        const tokenHash = (0, generateToken_1.hashToken)(refreshToken);
        const refreshSession = await refresh_session_model_1.default.findOne({ tokenHash }).session(session);
        if (!refreshSession) {
            // Legacy fallback logic
            const legacyUser = await user_model_1.default.findById(decoded.id).session(session);
            if (legacyUser && legacyUser.refreshToken === refreshToken) {
                // Continue but do not use new session logic
                const newAccessToken = (0, generateToken_1.generateAccessToken)(legacyUser._id.toString(), legacyUser.role || 'user', legacyUser.tokenVersion);
                const { token: newRefreshToken } = (0, generateToken_1.generateRefreshToken)(legacyUser._id.toString());
                legacyUser.refreshToken = newRefreshToken;
                await legacyUser.save({ session });
                await session.commitTransaction();
                return (0, api_response_1.ok)(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, { token: newAccessToken, refreshToken: newRefreshToken });
            }
            throw new app_error_1.AppError({ code: 'AUTH_REFRESH_REQUIRED', statusCode: 401, message: 'Session not found' });
        }
        if (refreshSession.revokedAt) {
            // Reuse detected! Revoke the entire family
            await refresh_session_model_1.default.updateMany({ familyId: refreshSession.familyId }, { $set: { revokedAt: new Date(), reuseDetectedAt: new Date() } }).session(session);
            await session.commitTransaction();
            session.endSession();
            logger_1.logger.warn('auth.refresh.reuse_detected', { familyId: refreshSession.familyId, userId: refreshSession.user });
            return next(new app_error_1.AppError({ code: 'AUTH_REFRESH_REUSED', statusCode: 401, message: 'Token reuse detected. All sessions revoked.' }));
        }
        if (refreshSession.expiresAt < new Date()) {
            throw new app_error_1.AppError({ code: 'AUTH_REFRESH_EXPIRED', statusCode: 401, message: 'Refresh token expired' });
        }
        const user = await user_model_1.default.findById(refreshSession.user).session(session);
        if (!user || user.status === 'disabled') {
            throw new app_error_1.AppError({ code: 'AUTH_ACCOUNT_DISABLED', statusCode: 401, message: 'Account disabled' });
        }
        // Atomic rotation
        const newAccessToken = (0, generateToken_1.generateAccessToken)(user._id.toString(), user.role || 'user', user.tokenVersion);
        const { token: newRefreshToken, jti: newJti } = (0, generateToken_1.generateRefreshToken)(user._id.toString());
        const newRefreshTokenHash = (0, generateToken_1.hashToken)(newRefreshToken);
        refreshSession.revokedAt = new Date();
        refreshSession.replacedByHash = newRefreshTokenHash;
        await refreshSession.save({ session });
        const newSession = new refresh_session_model_1.default({
            user: user._id,
            tokenHash: newRefreshTokenHash,
            familyId: refreshSession.familyId,
            deviceId: deviceId || refreshSession.deviceId,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        });
        // Legacy support
        // user.refreshToken = newRefreshToken; // Removed
        await user.save({ session });
        await newSession.save({ session });
        await session.commitTransaction();
        logger_1.logger.info('auth.refresh.rotated', { userId: user._id, familyId: refreshSession.familyId });
        return (0, api_response_1.ok)(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, { token: newAccessToken, refreshToken: newRefreshToken });
    }
    catch (error) {
        await session.abortTransaction();
        next(error);
    }
    finally {
        session.endSession();
    }
};
exports.refreshAccessToken = refreshAccessToken;
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { refreshToken } = req.body;
        if (refreshToken) {
            const tokenHash = (0, generateToken_1.hashToken)(refreshToken);
            await refresh_session_model_1.default.updateOne({ tokenHash, user: userId }, { revokedAt: new Date() });
        }
        // Legacy
        // await User.findByIdAndUpdate(userId, { refreshToken: null }); // Removed
        return (0, api_response_1.ok)(res, { message: "Logged out successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.logoutUser = logoutUser;
// @desc    Logout all sessions
// @route   POST /api/auth/logout-all
// @access  Private
const logoutAll = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const result = await refresh_session_model_1.default.updateMany({ user: userId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } });
        // Legacy
        // await User.findByIdAndUpdate(userId, { refreshToken: null }); // Removed
        logger_1.logger.info('auth.logout_all', { userId, revokedCount: result.modifiedCount });
        return (0, api_response_1.ok)(res, { revokedSessions: result.modifiedCount });
    }
    catch (error) {
        next(error);
    }
};
exports.logoutAll = logoutAll;
// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { email } = req.body;
        const user = await user_model_1.default.findOne({ email }).session(session);
        if (!user) {
            // Non-enumerating response
            await session.commitTransaction();
            return (0, api_response_1.ok)(res, { message: "If that email exists, password reset instructions have been sent." });
        }
        const token = crypto_1.default.randomBytes(32).toString("hex");
        const tokenHash = (0, generateToken_1.hashToken)(token);
        const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 mins
        const requestIpHash = crypto_1.default.createHash('md5').update(req.ip || 'unknown').digest('hex');
        const resetRequest = new password_reset_request_model_1.default({
            email,
            tokenHash,
            expiresAt,
            requestIpHash,
            used: false
        });
        const outboxJob = new outbox_job_model_1.default({
            type: 'password_reset',
            aggregateId: user._id.toString(),
            idempotencyKey: `password-reset:${req.requestId}`,
            payload: { email, token }
        });
        await resetRequest.save({ session });
        await outboxJob.save({ session });
        await session.commitTransaction();
        logger_1.logger.info('auth.password_reset.requested', { userId: user._id });
        return (0, api_response_1.ok)(res, { message: "If that email exists, password reset instructions have been sent." });
    }
    catch (error) {
        await session.abortTransaction();
        next(error);
    }
    finally {
        session.endSession();
    }
};
exports.forgotPassword = forgotPassword;
// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { token, newPassword } = req.body;
        const tokenHash = (0, generateToken_1.hashToken)(token);
        const resetRequest = await password_reset_request_model_1.default.findOne({
            tokenHash,
            used: false,
            expiresAt: { $gt: new Date() }
        }).session(session);
        if (!resetRequest) {
            throw new app_error_1.AppError({ code: 'AUTH_RESET_INVALID', statusCode: 400, message: 'Invalid or expired reset token' });
        }
        const user = await user_model_1.default.findOne({ email: resetRequest.email }).session(session);
        if (!user) {
            throw new app_error_1.AppError({ code: 'AUTH_RESET_INVALID', statusCode: 400, message: 'Invalid or expired reset token' });
        }
        user.password = await bcryptjs_1.default.hash(newPassword, 10);
        user.tokenVersion += 1; // Increment version to invalidate active access tokens
        await user.save({ session });
        resetRequest.used = true;
        resetRequest.usedAt = new Date();
        await resetRequest.save({ session });
        // Revoke all refresh sessions
        await refresh_session_model_1.default.updateMany({ user: user._id }, { $set: { revokedAt: new Date() } }).session(session);
        // Legacy
        // user.refreshToken = undefined; // Removed
        await user.save({ session });
        await session.commitTransaction();
        logger_1.logger.info('auth.password_reset.completed', { userId: user._id });
        return (0, api_response_1.ok)(res, { message: "Password has been reset successfully." });
    }
    catch (error) {
        await session.abortTransaction();
        next(error);
    }
    finally {
        session.endSession();
    }
};
exports.resetPassword = resetPassword;
// @desc    Verify email using token
// @route   GET /api/auth/verify-email/:token
// @access  Public
const verifyEmail = async (req, res, next) => {
    try {
        const token = req.params.token;
        const tokenHash = (0, generateToken_1.hashToken)(token);
        const user = await user_model_1.default.findOne({
            $or: [
                { emailVerificationTokenHash: tokenHash },
                { emailVerificationToken: token } // Legacy fallback
            ]
        });
        if (!user || (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date())) {
            throw new app_error_1.AppError({ code: 'AUTH_VERIFY_INVALID', statusCode: 400, message: 'Invalid or expired verification token' });
        }
        user.emailVerified = true;
        user.emailVerificationTokenHash = undefined;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpiresAt = undefined;
        await user.save();
        logger_1.logger.info('auth.email_verified', { userId: user._id });
        return (0, api_response_1.ok)(res, { message: "Email verified successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.verifyEmail = verifyEmail;
// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
const resendVerification = async (req, res, next) => {
    const session = await mongoose_1.default.startSession();
    session.startTransaction();
    try {
        const { email } = req.body;
        const user = await user_model_1.default.findOne({ email }).session(session);
        if (!user) {
            await session.commitTransaction();
            return (0, api_response_1.ok)(res, { message: "If that email exists, a verification link has been sent." });
        }
        if (user.emailVerified) {
            throw new app_error_1.AppError({ code: 'AUTH_ALREADY_VERIFIED', statusCode: 400, message: 'Email is already verified' });
        }
        const emailVerificationToken = crypto_1.default.randomBytes(32).toString("hex");
        const emailVerificationTokenHash = (0, generateToken_1.hashToken)(emailVerificationToken);
        user.emailVerificationTokenHash = emailVerificationTokenHash;
        user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
        // Legacy
        // user.emailVerificationToken = emailVerificationToken; // Removed
        await user.save({ session });
        // Versioning for idempotency key
        const version = user.tokenVersion || 1;
        const outboxJob = new outbox_job_model_1.default({
            type: 'email_verification',
            aggregateId: user._id.toString(),
            idempotencyKey: `email-verify:${user._id}:${version + Math.random()}`, // Added random for forced resends
            payload: { email: user.email, token: emailVerificationToken }
        });
        await outboxJob.save({ session });
        await session.commitTransaction();
        logger_1.logger.info('auth.email_verification.resent', { userId: user._id });
        return (0, api_response_1.ok)(res, { message: "Verification email sent." });
    }
    catch (error) {
        await session.abortTransaction();
        next(error);
    }
    finally {
        session.endSession();
    }
};
exports.resendVerification = resendVerification;
