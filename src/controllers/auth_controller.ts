import { Request, Response, NextFunction } from "express";
import bcrypt from 'bcryptjs';
import crypto from "crypto";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import User from "../models/user_model";
import PasswordResetRequest from "../models/password_reset_request_model";
import RefreshSession from "../models/refresh_session_model";
import OutboxJob from "../models/outbox_job_model";

import { generateAccessToken, generateRefreshToken, hashToken } from "../utils/generateToken";
import { AppError } from "../utils/app_error";
import { ok, created } from "../utils/api_response";
import { env } from "../config/env";
import { logger } from "../utils/logger";

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const { name, email, password, phoneNumber } = req.body;

    const userExists = await User.findOne({ email }).session(session);
    if (userExists) {
      throw new AppError({ code: 'AUTH_EMAIL_EXISTS', statusCode: 400, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationTokenHash = hashToken(emailVerificationToken);

    const user = new User({
      name,
      email,
      passwordHash: hashedPassword,
      phoneNumber,
      emailVerificationTokenHash,
      emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    });

    // Create Outbox Job for Email
    const outboxJob = new OutboxJob({
      type: 'email_verification',
      aggregateId: user._id.toString(),
      idempotencyKey: `email-verify:${user._id}:1`,
      payload: { email: user.email, token: emailVerificationToken }
    });

    await user.save({ session });
    await outboxJob.save({ session });

    // Generate tokens
    const accessToken = generateAccessToken(user._id.toString(), user.role || 'user', user.tokenVersion);
    const { token: refreshToken, jti } = generateRefreshToken(user._id.toString());
    const refreshTokenHash = hashToken(refreshToken);
    
    // Legacy support fallback
    // user.refreshToken = refreshToken; // Removed
    // user.emailVerificationToken = emailVerificationToken; // Removed
    await user.save({ session });

    // Store secure refresh session
    const refreshSession = new RefreshSession({
      user: user._id,
      tokenHash: refreshTokenHash,
      familyId: jti,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    });
    
    await refreshSession.save({ session });
    await session.commitTransaction();

    logger.info('auth.login.success', { userId: user._id, action: 'register' });

    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    };

    return created(res, { accessToken, refreshToken, user: userData }, { token: accessToken, refreshToken, user: userData });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password, deviceId } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      logger.info('auth.login.failed', { email, reason: 'not_found' });
      throw new AppError({ code: 'AUTH_INVALID_CREDENTIALS', statusCode: 401, message: 'Invalid email or password' });
    }

    if (user.status === 'disabled') {
      logger.info('auth.login.failed', { userId: user._id, reason: 'disabled' });
      throw new AppError({ code: 'AUTH_ACCOUNT_DISABLED', statusCode: 403, message: 'Account is disabled' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash || user.password || '');
    if (!isMatch) {
      logger.info('auth.login.failed', { userId: user._id, reason: 'bad_password' });
      throw new AppError({ code: 'AUTH_INVALID_CREDENTIALS', statusCode: 401, message: 'Invalid email or password' });
    }

    const accessToken = generateAccessToken(user._id.toString(), user.role || 'user', user.tokenVersion);
    const { token: refreshToken, jti } = generateRefreshToken(user._id.toString());
    const refreshTokenHash = hashToken(refreshToken);

    const refreshSession = new RefreshSession({
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

    logger.info('auth.login.success', { userId: user._id, deviceId });

    const userData = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber || "",
      avatarUrl: user.avatarUrl || "",
      createdAt: user.createdAt.toISOString(),
    };

    return ok(res, { accessToken, refreshToken, user: userData }, { token: accessToken, refreshToken, user: userData });
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshAccessToken = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { refreshToken, deviceId } = req.body;

    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, env.JWT_REFRESH_SECRET);
    } catch (err) {
      throw new AppError({ code: 'AUTH_REFRESH_EXPIRED', statusCode: 401, message: 'Invalid or expired refresh token' });
    }

    const tokenHash = hashToken(refreshToken);
    const refreshSession = await RefreshSession.findOne({ tokenHash }).session(session);

    if (!refreshSession) {
      // Legacy fallback logic
      const legacyUser = await User.findById(decoded.id).session(session);
      if (legacyUser && legacyUser.refreshToken === refreshToken) {
        // Continue but do not use new session logic
        const newAccessToken = generateAccessToken(legacyUser._id.toString(), legacyUser.role || 'user', legacyUser.tokenVersion);
        const { token: newRefreshToken } = generateRefreshToken(legacyUser._id.toString());
        legacyUser.refreshToken = newRefreshToken;
        await legacyUser.save({ session });
        await session.commitTransaction();
        return ok(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, { token: newAccessToken, refreshToken: newRefreshToken });
      }
      throw new AppError({ code: 'AUTH_REFRESH_REQUIRED', statusCode: 401, message: 'Session not found' });
    }

    if (refreshSession.revokedAt) {
      // Reuse detected! Revoke the entire family
      await RefreshSession.updateMany(
        { familyId: refreshSession.familyId },
        { $set: { revokedAt: new Date(), reuseDetectedAt: new Date() } }
      ).session(session);
      await session.commitTransaction();
      session.endSession();
      logger.warn('auth.refresh.reuse_detected', { familyId: refreshSession.familyId, userId: refreshSession.user });
      return next(new AppError({ code: 'AUTH_REFRESH_REUSED', statusCode: 401, message: 'Token reuse detected. All sessions revoked.' }));
    }

    if (refreshSession.expiresAt < new Date()) {
      throw new AppError({ code: 'AUTH_REFRESH_EXPIRED', statusCode: 401, message: 'Refresh token expired' });
    }

    const user = await User.findById(refreshSession.user).session(session);
    if (!user || user.status === 'disabled') {
      throw new AppError({ code: 'AUTH_ACCOUNT_DISABLED', statusCode: 401, message: 'Account disabled' });
    }

    // Atomic rotation
    const newAccessToken = generateAccessToken(user._id.toString(), user.role || 'user', user.tokenVersion);
    const { token: newRefreshToken, jti: newJti } = generateRefreshToken(user._id.toString());
    const newRefreshTokenHash = hashToken(newRefreshToken);

    refreshSession.revokedAt = new Date();
    refreshSession.replacedByHash = newRefreshTokenHash;
    await refreshSession.save({ session });

    const newSession = new RefreshSession({
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
    logger.info('auth.refresh.rotated', { userId: user._id, familyId: refreshSession.familyId });

    return ok(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, { token: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { refreshToken } = req.body;

    if (refreshToken) {
      const tokenHash = hashToken(refreshToken);
      await RefreshSession.updateOne({ tokenHash, user: userId }, { revokedAt: new Date() });
    }
    
    // Legacy
    // await User.findByIdAndUpdate(userId, { refreshToken: null }); // Removed

    return ok(res, { message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout all sessions
// @route   POST /api/auth/logout-all
// @access  Private
export const logoutAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;

    const result = await RefreshSession.updateMany(
      { user: userId, revokedAt: { $exists: false } },
      { $set: { revokedAt: new Date() } }
    );
    
    // Legacy
    // await User.findByIdAndUpdate(userId, { refreshToken: null }); // Removed

    logger.info('auth.logout_all', { userId, revokedCount: result.modifiedCount });
    return ok(res, { revokedSessions: result.modifiedCount });
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).session(session);
    if (!user) {
      // Non-enumerating response
      await session.commitTransaction();
      return ok(res, { message: "If that email exists, password reset instructions have been sent." });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 30); // 30 mins

    const requestIpHash = crypto.createHash('md5').update(req.ip || 'unknown').digest('hex');

    const resetRequest = new PasswordResetRequest({
      email,
      tokenHash,
      expiresAt,
      requestIpHash,
      used: false
    });

    const outboxJob = new OutboxJob({
      type: 'password_reset',
      aggregateId: user._id.toString(),
      idempotencyKey: `password-reset:${(req as any).requestId}`,
      payload: { email, token }
    });

    await resetRequest.save({ session });
    await outboxJob.save({ session });

    await session.commitTransaction();
    logger.info('auth.password_reset.requested', { userId: user._id });

    return ok(res, { message: "If that email exists, password reset instructions have been sent." });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { token, newPassword } = req.body;
    const tokenHash = hashToken(token);

    const resetRequest = await PasswordResetRequest.findOne({
      tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    }).session(session);

    if (!resetRequest) {
      throw new AppError({ code: 'AUTH_RESET_INVALID', statusCode: 400, message: 'Invalid or expired reset token' });
    }

    const user = await User.findOne({ email: resetRequest.email }).session(session);
    if (!user) {
      throw new AppError({ code: 'AUTH_RESET_INVALID', statusCode: 400, message: 'Invalid or expired reset token' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1; // Invalidate all active access tokens
    await user.save({ session });

    resetRequest.used = true;
    resetRequest.usedAt = new Date();
    await resetRequest.save({ session });

    // Revoke all refresh sessions so the user must re-login everywhere
    await RefreshSession.updateMany(
      { user: user._id },
      { $set: { revokedAt: new Date() } }
    ).session(session);

    await session.commitTransaction();
    logger.info('auth.password_reset.completed', { userId: user._id });

    return ok(res, { message: "Password has been reset successfully." });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Verify email using token
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.params.token as string;
    const tokenHash = hashToken(token);

    const user = await User.findOne({ 
      $or: [
        { emailVerificationTokenHash: tokenHash },
        { emailVerificationToken: token } // Legacy fallback
      ]
    });
    
    if (!user || (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date())) {
      throw new AppError({ code: 'AUTH_VERIFY_INVALID', statusCode: 400, message: 'Invalid or expired verification token' });
    }
    
    user.emailVerified = true;
    user.emailVerificationTokenHash = undefined;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiresAt = undefined;
    await user.save();
    
    logger.info('auth.email_verified', { userId: user._id });
    return ok(res, { message: "Email verified successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
export const resendVerification = async (req: Request, res: Response, next: NextFunction) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { email } = req.body;

    const user = await User.findOne({ email }).session(session);
    if (!user) {
      await session.commitTransaction();
      return ok(res, { message: "If that email exists, a verification link has been sent." });
    }

    if (user.emailVerified) {
      throw new AppError({ code: 'AUTH_ALREADY_VERIFIED', statusCode: 400, message: 'Email is already verified' });
    }

    const emailVerificationToken = crypto.randomBytes(32).toString("hex");
    const emailVerificationTokenHash = hashToken(emailVerificationToken);
    
    user.emailVerificationTokenHash = emailVerificationTokenHash;
    user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    // Legacy
    // user.emailVerificationToken = emailVerificationToken; // Removed
    
    await user.save({ session });

    // Idempotency key: scoped per user + minute (prevents duplicate sends within 60s)
    const minuteBucket = Math.floor(Date.now() / 60000);
    const outboxJob = new OutboxJob({
      type: 'email_verification',
      aggregateId: user._id.toString(),
      idempotencyKey: `email-verify:${user._id}:${minuteBucket}`,
      payload: { email: user.email, token: emailVerificationToken }
    });

    await outboxJob.save({ session });
    await session.commitTransaction();

    logger.info('auth.email_verification.resent', { userId: user._id });
    return ok(res, { message: "Verification email sent." });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
