"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpertStatus = exports.UserRole = exports.UserLevel = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
var UserLevel;
(function (UserLevel) {
    UserLevel["SPROUT"] = "Sprout";
    UserLevel["GARDENER"] = "Gardener";
    UserLevel["BOTANIST"] = "Botanist";
})(UserLevel || (exports.UserLevel = UserLevel = {}));
var UserRole;
(function (UserRole) {
    UserRole["USER"] = "user";
    UserRole["EXPERT"] = "expert";
    UserRole["MODERATOR"] = "moderator";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
var ExpertStatus;
(function (ExpertStatus) {
    ExpertStatus["PENDING"] = "PENDING";
    ExpertStatus["APPROVED"] = "APPROVED";
    ExpertStatus["REJECTED"] = "REJECTED";
})(ExpertStatus || (exports.ExpertStatus = ExpertStatus = {}));
const userSchema = new mongoose_1.default.Schema({
    // ── Core credentials ──────────────────────────────────────────────────────
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    /** Legacy field — always use passwordHash; excluded from query results */
    password: { type: String, select: false },
    // ── Profile (were missing → Mongoose strict mode silently discarded them) ─
    name: { type: String, trim: true },
    phoneNumber: { type: String, trim: true },
    selectedCountry: { type: String, trim: true },
    avatarUrl: { type: String, trim: true },
    coverUrl: { type: String, trim: true },
    bio: { type: String, trim: true },
    accountType: { type: String, trim: true },
    preferences: { type: mongoose_1.default.Schema.Types.Mixed, default: {} },
    interests: [{ type: String }],
    // ── Role / Level / Settings ───────────────────────────────────────────────
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    expertStatus: { type: String, enum: Object.values(ExpertStatus) },
    level: { type: String, enum: Object.values(UserLevel), default: UserLevel.SPROUT },
    pushEnabled: { type: Boolean, default: true },
    autoAddEnabled: { type: Boolean, default: true },
    fcmToken: { type: String },
    // ── Location ──────────────────────────────────────────────────────────────
    latitude: { type: Number },
    longitude: { type: Number },
    // ── Account status & session security ─────────────────────────────────────
    /** 'active' | 'disabled' | 'pending_verification' */
    status: { type: String, enum: ['active', 'disabled', 'pending_verification'], default: 'active' },
    tokenVersion: { type: Number, default: 0 },
    // ── Email verification ────────────────────────────────────────────────────
    emailVerified: { type: Boolean, default: false },
    isSuspended: { type: Boolean, default: false },
    isMuted: { type: Boolean, default: false },
    isBanned: { type: Boolean, default: false },
    suspensionReason: { type: String },
    banReason: { type: String },
    emailVerificationTokenHash: { type: String, select: false },
    emailVerificationToken: { type: String, select: false }, // legacy
    emailVerificationExpiresAt: { type: Date },
    // ── Refresh token (legacy — superseded by RefreshSession collection) ───────
    refreshToken: { type: String, select: false },
    // ── Soft-delete ───────────────────────────────────────────────────────────
    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: mongoose_1.default.Schema.Types.ObjectId, ref: 'User', default: null },
}, {
    timestamps: true
});
// ── Indexes ───────────────────────────────────────────────────────────────────
// Auth lookups: (email, status) covers login + status-check in one DB round trip
userSchema.index({ email: 1, status: 1 });
// Admin role-filter queries
userSchema.index({ role: 1 });
// Soft-delete filter used in the global pre-find hook
userSchema.index({ isDeleted: 1 });
// ── Global pre-find hook: exclude soft-deleted users from all queries ──────────
userSchema.pre(/^find/, function (next) {
    const query = this;
    query.find({ isDeleted: { $ne: true } });
    next();
});
exports.default = mongoose_1.default.model('User', userSchema);
