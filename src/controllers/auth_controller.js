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
exports.resendVerification = exports.verifyEmail = exports.resetPassword = exports.forgotPassword = exports.logoutAll = exports.logoutUser = exports.refreshAccessToken = exports.loginUser = exports.registerUser = void 0;
var bcryptjs_1 = __importDefault(require("bcryptjs"));
var crypto_1 = __importDefault(require("crypto"));
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var mongoose_1 = __importDefault(require("mongoose"));
var user_model_1 = __importDefault(require("../models/user_model"));
var password_reset_request_model_1 = __importDefault(require("../models/password_reset_request_model"));
var refresh_session_model_1 = __importDefault(require("../models/refresh_session_model"));
var outbox_job_model_1 = __importDefault(require("../models/outbox_job_model"));
var generateToken_1 = require("../utils/generateToken");
var app_error_1 = require("../utils/app_error");
var api_response_1 = require("../utils/api_response");
var env_1 = require("../config/env");
var logger_1 = require("../utils/logger");
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
var registerUser = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var session, _a, name_1, email, password, phoneNumber, userExists, hashedPassword, emailVerificationToken, emailVerificationTokenHash, user, outboxJob, accessToken, _b, refreshToken, jti, refreshTokenHash, refreshSession, userData, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, mongoose_1.default.startSession()];
            case 1:
                session = _c.sent();
                session.startTransaction();
                _c.label = 2;
            case 2:
                _c.trys.push([2, 10, 12, 13]);
                _a = req.body, name_1 = _a.name, email = _a.email, password = _a.password, phoneNumber = _a.phoneNumber;
                return [4 /*yield*/, user_model_1.default.findOne({ email: email }).session(session)];
            case 3:
                userExists = _c.sent();
                if (userExists) {
                    throw new app_error_1.AppError({ code: 'AUTH_EMAIL_EXISTS', statusCode: 400, message: 'User already exists' });
                }
                return [4 /*yield*/, bcryptjs_1.default.hash(password, 10)];
            case 4:
                hashedPassword = _c.sent();
                emailVerificationToken = crypto_1.default.randomBytes(32).toString("hex");
                emailVerificationTokenHash = (0, generateToken_1.hashToken)(emailVerificationToken);
                user = new user_model_1.default({
                    name: name_1,
                    email: email,
                    passwordHash: hashedPassword,
                    phoneNumber: phoneNumber,
                    emailVerificationTokenHash: emailVerificationTokenHash,
                    emailVerificationExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
                });
                outboxJob = new outbox_job_model_1.default({
                    type: 'email_verification',
                    aggregateId: user._id.toString(),
                    idempotencyKey: "email-verify:".concat(user._id, ":1"),
                    payload: { email: user.email, token: emailVerificationToken }
                });
                return [4 /*yield*/, user.save({ session: session })];
            case 5:
                _c.sent();
                return [4 /*yield*/, outboxJob.save({ session: session })];
            case 6:
                _c.sent();
                accessToken = (0, generateToken_1.generateAccessToken)(user._id.toString(), user.role || 'user', user.tokenVersion);
                _b = (0, generateToken_1.generateRefreshToken)(user._id.toString()), refreshToken = _b.token, jti = _b.jti;
                refreshTokenHash = (0, generateToken_1.hashToken)(refreshToken);
                // Legacy support fallback
                // user.refreshToken = refreshToken; // Removed
                // user.emailVerificationToken = emailVerificationToken; // Removed
                return [4 /*yield*/, user.save({ session: session })];
            case 7:
                // Legacy support fallback
                // user.refreshToken = refreshToken; // Removed
                // user.emailVerificationToken = emailVerificationToken; // Removed
                _c.sent();
                refreshSession = new refresh_session_model_1.default({
                    user: user._id,
                    tokenHash: refreshTokenHash,
                    familyId: jti,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                });
                return [4 /*yield*/, refreshSession.save({ session: session })];
            case 8:
                _c.sent();
                return [4 /*yield*/, session.commitTransaction()];
            case 9:
                _c.sent();
                logger_1.logger.info('auth.login.success', { userId: user._id, action: 'register' });
                userData = {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phoneNumber: user.phoneNumber,
                    avatarUrl: user.avatarUrl,
                    createdAt: user.createdAt,
                };
                return [2 /*return*/, (0, api_response_1.created)(res, { accessToken: accessToken, refreshToken: refreshToken, user: userData }, { token: accessToken, refreshToken: refreshToken, user: userData })];
            case 10:
                error_1 = _c.sent();
                return [4 /*yield*/, session.abortTransaction()];
            case 11:
                _c.sent();
                next(error_1);
                return [3 /*break*/, 13];
            case 12:
                session.endSession();
                return [7 /*endfinally*/];
            case 13: return [2 /*return*/];
        }
    });
}); };
exports.registerUser = registerUser;
// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
var loginUser = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, deviceId, user, isMatch, accessToken, _b, refreshToken, jti, refreshTokenHash, refreshSession, userData, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 5, , 6]);
                _a = req.body, email = _a.email, password = _a.password, deviceId = _a.deviceId;
                return [4 /*yield*/, user_model_1.default.findOne({ email: email })];
            case 1:
                user = _c.sent();
                if (!user) {
                    logger_1.logger.info('auth.login.failed', { email: email, reason: 'not_found' });
                    throw new app_error_1.AppError({ code: 'AUTH_INVALID_CREDENTIALS', statusCode: 401, message: 'Invalid email or password' });
                }
                if (user.status === 'disabled') {
                    logger_1.logger.info('auth.login.failed', { userId: user._id, reason: 'disabled' });
                    throw new app_error_1.AppError({ code: 'AUTH_ACCOUNT_DISABLED', statusCode: 403, message: 'Account is disabled' });
                }
                return [4 /*yield*/, bcryptjs_1.default.compare(password, user.passwordHash || user.password || '')];
            case 2:
                isMatch = _c.sent();
                if (!isMatch) {
                    logger_1.logger.info('auth.login.failed', { userId: user._id, reason: 'bad_password' });
                    throw new app_error_1.AppError({ code: 'AUTH_INVALID_CREDENTIALS', statusCode: 401, message: 'Invalid email or password' });
                }
                accessToken = (0, generateToken_1.generateAccessToken)(user._id.toString(), user.role || 'user', user.tokenVersion);
                _b = (0, generateToken_1.generateRefreshToken)(user._id.toString()), refreshToken = _b.token, jti = _b.jti;
                refreshTokenHash = (0, generateToken_1.hashToken)(refreshToken);
                refreshSession = new refresh_session_model_1.default({
                    user: user._id,
                    tokenHash: refreshTokenHash,
                    familyId: jti,
                    deviceId: deviceId,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                });
                // Legacy support
                // user.refreshToken = refreshToken; // Removed
                return [4 /*yield*/, user.save()];
            case 3:
                // Legacy support
                // user.refreshToken = refreshToken; // Removed
                _c.sent();
                return [4 /*yield*/, refreshSession.save()];
            case 4:
                _c.sent();
                logger_1.logger.info('auth.login.success', { userId: user._id, deviceId: deviceId });
                userData = {
                    id: user._id.toString(),
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    phoneNumber: user.phoneNumber || "",
                    avatarUrl: user.avatarUrl || "",
                    createdAt: user.createdAt.toISOString(),
                };
                return [2 /*return*/, (0, api_response_1.ok)(res, { accessToken: accessToken, refreshToken: refreshToken, user: userData }, { token: accessToken, refreshToken: refreshToken, user: userData })];
            case 5:
                error_2 = _c.sent();
                next(error_2);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.loginUser = loginUser;
// @desc    Refresh access token
// @route   POST /api/auth/refresh-token
// @access  Public
var refreshAccessToken = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var session, _a, refreshToken, deviceId, decoded, tokenHash, refreshSession, legacyUser, newAccessToken_1, newRefreshToken_1, user, newAccessToken, _b, newRefreshToken, newJti, newRefreshTokenHash, newSession, error_3;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, mongoose_1.default.startSession()];
            case 1:
                session = _c.sent();
                session.startTransaction();
                _c.label = 2;
            case 2:
                _c.trys.push([2, 17, 19, 20]);
                _a = req.body, refreshToken = _a.refreshToken, deviceId = _a.deviceId;
                decoded = void 0;
                try {
                    decoded = jsonwebtoken_1.default.verify(refreshToken, env_1.env.JWT_REFRESH_SECRET);
                }
                catch (err) {
                    throw new app_error_1.AppError({ code: 'AUTH_REFRESH_EXPIRED', statusCode: 401, message: 'Invalid or expired refresh token' });
                }
                tokenHash = (0, generateToken_1.hashToken)(refreshToken);
                return [4 /*yield*/, refresh_session_model_1.default.findOne({ tokenHash: tokenHash }).session(session)];
            case 3:
                refreshSession = _c.sent();
                if (!!refreshSession) return [3 /*break*/, 8];
                return [4 /*yield*/, user_model_1.default.findById(decoded.id).session(session)];
            case 4:
                legacyUser = _c.sent();
                if (!(legacyUser && legacyUser.refreshToken === refreshToken)) return [3 /*break*/, 7];
                newAccessToken_1 = (0, generateToken_1.generateAccessToken)(legacyUser._id.toString(), legacyUser.role || 'user', legacyUser.tokenVersion);
                newRefreshToken_1 = (0, generateToken_1.generateRefreshToken)(legacyUser._id.toString()).token;
                legacyUser.refreshToken = newRefreshToken_1;
                return [4 /*yield*/, legacyUser.save({ session: session })];
            case 5:
                _c.sent();
                return [4 /*yield*/, session.commitTransaction()];
            case 6:
                _c.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { accessToken: newAccessToken_1, refreshToken: newRefreshToken_1 }, { token: newAccessToken_1, refreshToken: newRefreshToken_1 })];
            case 7: throw new app_error_1.AppError({ code: 'AUTH_REFRESH_REQUIRED', statusCode: 401, message: 'Session not found' });
            case 8:
                if (!refreshSession.revokedAt) return [3 /*break*/, 11];
                // Reuse detected! Revoke the entire family
                return [4 /*yield*/, refresh_session_model_1.default.updateMany({ familyId: refreshSession.familyId }, { $set: { revokedAt: new Date(), reuseDetectedAt: new Date() } }).session(session)];
            case 9:
                // Reuse detected! Revoke the entire family
                _c.sent();
                return [4 /*yield*/, session.commitTransaction()];
            case 10:
                _c.sent();
                session.endSession();
                logger_1.logger.warn('auth.refresh.reuse_detected', { familyId: refreshSession.familyId, userId: refreshSession.user });
                return [2 /*return*/, next(new app_error_1.AppError({ code: 'AUTH_REFRESH_REUSED', statusCode: 401, message: 'Token reuse detected. All sessions revoked.' }))];
            case 11:
                if (refreshSession.expiresAt < new Date()) {
                    throw new app_error_1.AppError({ code: 'AUTH_REFRESH_EXPIRED', statusCode: 401, message: 'Refresh token expired' });
                }
                return [4 /*yield*/, user_model_1.default.findById(refreshSession.user).session(session)];
            case 12:
                user = _c.sent();
                if (!user || user.status === 'disabled') {
                    throw new app_error_1.AppError({ code: 'AUTH_ACCOUNT_DISABLED', statusCode: 401, message: 'Account disabled' });
                }
                newAccessToken = (0, generateToken_1.generateAccessToken)(user._id.toString(), user.role || 'user', user.tokenVersion);
                _b = (0, generateToken_1.generateRefreshToken)(user._id.toString()), newRefreshToken = _b.token, newJti = _b.jti;
                newRefreshTokenHash = (0, generateToken_1.hashToken)(newRefreshToken);
                refreshSession.revokedAt = new Date();
                refreshSession.replacedByHash = newRefreshTokenHash;
                return [4 /*yield*/, refreshSession.save({ session: session })];
            case 13:
                _c.sent();
                newSession = new refresh_session_model_1.default({
                    user: user._id,
                    tokenHash: newRefreshTokenHash,
                    familyId: refreshSession.familyId,
                    deviceId: deviceId || refreshSession.deviceId,
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                });
                // Legacy support
                // user.refreshToken = newRefreshToken; // Removed
                return [4 /*yield*/, user.save({ session: session })];
            case 14:
                // Legacy support
                // user.refreshToken = newRefreshToken; // Removed
                _c.sent();
                return [4 /*yield*/, newSession.save({ session: session })];
            case 15:
                _c.sent();
                return [4 /*yield*/, session.commitTransaction()];
            case 16:
                _c.sent();
                logger_1.logger.info('auth.refresh.rotated', { userId: user._id, familyId: refreshSession.familyId });
                return [2 /*return*/, (0, api_response_1.ok)(res, { accessToken: newAccessToken, refreshToken: newRefreshToken }, { token: newAccessToken, refreshToken: newRefreshToken })];
            case 17:
                error_3 = _c.sent();
                return [4 /*yield*/, session.abortTransaction()];
            case 18:
                _c.sent();
                next(error_3);
                return [3 /*break*/, 20];
            case 19:
                session.endSession();
                return [7 /*endfinally*/];
            case 20: return [2 /*return*/];
        }
    });
}); };
exports.refreshAccessToken = refreshAccessToken;
// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
var logoutUser = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, refreshToken, tokenHash, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.id;
                refreshToken = req.body.refreshToken;
                if (!refreshToken) return [3 /*break*/, 2];
                tokenHash = (0, generateToken_1.hashToken)(refreshToken);
                return [4 /*yield*/, refresh_session_model_1.default.updateOne({ tokenHash: tokenHash, user: userId }, { revokedAt: new Date() })];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: 
            // Legacy
            // await User.findByIdAndUpdate(userId, { refreshToken: null }); // Removed
            return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Logged out successfully" })];
            case 3:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.logoutUser = logoutUser;
// @desc    Logout all sessions
// @route   POST /api/auth/logout-all
// @access  Private
var logoutAll = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                return [4 /*yield*/, refresh_session_model_1.default.updateMany({ user: userId, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } })];
            case 1:
                result = _a.sent();
                // Legacy
                // await User.findByIdAndUpdate(userId, { refreshToken: null }); // Removed
                logger_1.logger.info('auth.logout_all', { userId: userId, revokedCount: result.modifiedCount });
                return [2 /*return*/, (0, api_response_1.ok)(res, { revokedSessions: result.modifiedCount })];
            case 2:
                error_5 = _a.sent();
                next(error_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.logoutAll = logoutAll;
// @desc    Request password reset email
// @route   POST /api/auth/forgot-password
// @access  Public
var forgotPassword = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var session, email, user, token, tokenHash, expiresAt, requestIpHash, resetRequest, outboxJob, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, mongoose_1.default.startSession()];
            case 1:
                session = _a.sent();
                session.startTransaction();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 9, 11, 12]);
                email = req.body.email;
                return [4 /*yield*/, user_model_1.default.findOne({ email: email }).session(session)];
            case 3:
                user = _a.sent();
                if (!!user) return [3 /*break*/, 5];
                // Non-enumerating response
                return [4 /*yield*/, session.commitTransaction()];
            case 4:
                // Non-enumerating response
                _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "If that email exists, password reset instructions have been sent." })];
            case 5:
                token = crypto_1.default.randomBytes(32).toString("hex");
                tokenHash = (0, generateToken_1.hashToken)(token);
                expiresAt = new Date(Date.now() + 1000 * 60 * 30);
                requestIpHash = crypto_1.default.createHash('md5').update(req.ip || 'unknown').digest('hex');
                resetRequest = new password_reset_request_model_1.default({
                    email: email,
                    tokenHash: tokenHash,
                    expiresAt: expiresAt,
                    requestIpHash: requestIpHash,
                    used: false
                });
                outboxJob = new outbox_job_model_1.default({
                    type: 'password_reset',
                    aggregateId: user._id.toString(),
                    idempotencyKey: "password-reset:".concat(req.requestId),
                    payload: { email: email, token: token }
                });
                return [4 /*yield*/, resetRequest.save({ session: session })];
            case 6:
                _a.sent();
                return [4 /*yield*/, outboxJob.save({ session: session })];
            case 7:
                _a.sent();
                return [4 /*yield*/, session.commitTransaction()];
            case 8:
                _a.sent();
                logger_1.logger.info('auth.password_reset.requested', { userId: user._id });
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "If that email exists, password reset instructions have been sent." })];
            case 9:
                error_6 = _a.sent();
                return [4 /*yield*/, session.abortTransaction()];
            case 10:
                _a.sent();
                next(error_6);
                return [3 /*break*/, 12];
            case 11:
                session.endSession();
                return [7 /*endfinally*/];
            case 12: return [2 /*return*/];
        }
    });
}); };
exports.forgotPassword = forgotPassword;
// @desc    Reset password using token
// @route   POST /api/auth/reset-password
// @access  Public
var resetPassword = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var session, _a, token, newPassword, tokenHash, resetRequest, user, _b, error_7;
    var _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0: return [4 /*yield*/, mongoose_1.default.startSession()];
            case 1:
                session = _d.sent();
                session.startTransaction();
                _d.label = 2;
            case 2:
                _d.trys.push([2, 10, 12, 13]);
                _a = req.body, token = _a.token, newPassword = _a.newPassword;
                tokenHash = (0, generateToken_1.hashToken)(token);
                return [4 /*yield*/, password_reset_request_model_1.default.findOne({
                        tokenHash: tokenHash,
                        used: false,
                        expiresAt: { $gt: new Date() }
                    }).session(session)];
            case 3:
                resetRequest = _d.sent();
                if (!resetRequest) {
                    throw new app_error_1.AppError({ code: 'AUTH_RESET_INVALID', statusCode: 400, message: 'Invalid or expired reset token' });
                }
                return [4 /*yield*/, user_model_1.default.findOne({ email: resetRequest.email }).session(session)];
            case 4:
                user = _d.sent();
                if (!user) {
                    throw new app_error_1.AppError({ code: 'AUTH_RESET_INVALID', statusCode: 400, message: 'Invalid or expired reset token' });
                }
                _b = user;
                return [4 /*yield*/, bcryptjs_1.default.hash(newPassword, 10)];
            case 5:
                _b.passwordHash = _d.sent();
                user.tokenVersion = ((_c = user.tokenVersion) !== null && _c !== void 0 ? _c : 0) + 1; // Invalidate all active access tokens
                return [4 /*yield*/, user.save({ session: session })];
            case 6:
                _d.sent();
                resetRequest.used = true;
                resetRequest.usedAt = new Date();
                return [4 /*yield*/, resetRequest.save({ session: session })];
            case 7:
                _d.sent();
                // Revoke all refresh sessions so the user must re-login everywhere
                return [4 /*yield*/, refresh_session_model_1.default.updateMany({ user: user._id }, { $set: { revokedAt: new Date() } }).session(session)];
            case 8:
                // Revoke all refresh sessions so the user must re-login everywhere
                _d.sent();
                return [4 /*yield*/, session.commitTransaction()];
            case 9:
                _d.sent();
                logger_1.logger.info('auth.password_reset.completed', { userId: user._id });
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Password has been reset successfully." })];
            case 10:
                error_7 = _d.sent();
                return [4 /*yield*/, session.abortTransaction()];
            case 11:
                _d.sent();
                next(error_7);
                return [3 /*break*/, 13];
            case 12:
                session.endSession();
                return [7 /*endfinally*/];
            case 13: return [2 /*return*/];
        }
    });
}); };
exports.resetPassword = resetPassword;
// @desc    Verify email using token
// @route   GET /api/auth/verify-email/:token
// @access  Public
var verifyEmail = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, tokenHash, user, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                token = req.params.token;
                tokenHash = (0, generateToken_1.hashToken)(token);
                return [4 /*yield*/, user_model_1.default.findOne({
                        $or: [
                            { emailVerificationTokenHash: tokenHash },
                            { emailVerificationToken: token } // Legacy fallback
                        ]
                    })];
            case 1:
                user = _a.sent();
                if (!user || (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date())) {
                    throw new app_error_1.AppError({ code: 'AUTH_VERIFY_INVALID', statusCode: 400, message: 'Invalid or expired verification token' });
                }
                user.emailVerified = true;
                user.emailVerificationTokenHash = undefined;
                user.emailVerificationToken = undefined;
                user.emailVerificationExpiresAt = undefined;
                return [4 /*yield*/, user.save()];
            case 2:
                _a.sent();
                logger_1.logger.info('auth.email_verified', { userId: user._id });
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Email verified successfully" })];
            case 3:
                error_8 = _a.sent();
                next(error_8);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.verifyEmail = verifyEmail;
// @desc    Resend verification email
// @route   POST /api/auth/resend-verification
// @access  Public
var resendVerification = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var session, email, user, emailVerificationToken, emailVerificationTokenHash, minuteBucket, outboxJob, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, mongoose_1.default.startSession()];
            case 1:
                session = _a.sent();
                session.startTransaction();
                _a.label = 2;
            case 2:
                _a.trys.push([2, 9, 11, 12]);
                email = req.body.email;
                return [4 /*yield*/, user_model_1.default.findOne({ email: email }).session(session)];
            case 3:
                user = _a.sent();
                if (!!user) return [3 /*break*/, 5];
                return [4 /*yield*/, session.commitTransaction()];
            case 4:
                _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "If that email exists, a verification link has been sent." })];
            case 5:
                if (user.emailVerified) {
                    throw new app_error_1.AppError({ code: 'AUTH_ALREADY_VERIFIED', statusCode: 400, message: 'Email is already verified' });
                }
                emailVerificationToken = crypto_1.default.randomBytes(32).toString("hex");
                emailVerificationTokenHash = (0, generateToken_1.hashToken)(emailVerificationToken);
                user.emailVerificationTokenHash = emailVerificationTokenHash;
                user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
                // Legacy
                // user.emailVerificationToken = emailVerificationToken; // Removed
                return [4 /*yield*/, user.save({ session: session })];
            case 6:
                // Legacy
                // user.emailVerificationToken = emailVerificationToken; // Removed
                _a.sent();
                minuteBucket = Math.floor(Date.now() / 60000);
                outboxJob = new outbox_job_model_1.default({
                    type: 'email_verification',
                    aggregateId: user._id.toString(),
                    idempotencyKey: "email-verify:".concat(user._id, ":").concat(minuteBucket),
                    payload: { email: user.email, token: emailVerificationToken }
                });
                return [4 /*yield*/, outboxJob.save({ session: session })];
            case 7:
                _a.sent();
                return [4 /*yield*/, session.commitTransaction()];
            case 8:
                _a.sent();
                logger_1.logger.info('auth.email_verification.resent', { userId: user._id });
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Verification email sent." })];
            case 9:
                error_9 = _a.sent();
                return [4 /*yield*/, session.abortTransaction()];
            case 10:
                _a.sent();
                next(error_9);
                return [3 /*break*/, 12];
            case 11:
                session.endSession();
                return [7 /*endfinally*/];
            case 12: return [2 /*return*/];
        }
    });
}); };
exports.resendVerification = resendVerification;
