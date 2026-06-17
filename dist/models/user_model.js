"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRole = exports.UserLevel = void 0;
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
    UserRole["MODERATOR"] = "moderator";
    UserRole["ADMIN"] = "admin";
    UserRole["SUPER_ADMIN"] = "super_admin";
})(UserRole || (exports.UserRole = UserRole = {}));
const userSchema = new mongoose_1.default.Schema({
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    fcmToken: { type: String, required: false },
    level: { type: String, enum: Object.values(UserLevel), default: UserLevel.SPROUT },
    pushEnabled: { type: Boolean, default: true },
    autoAddEnabled: { type: Boolean, default: true },
    latitude: { type: Number, required: false },
    longitude: { type: Number, required: false },
    emailVerificationExpiresAt: { type: Date, required: false },
    deletedAt: { type: Date, default: null }
}, {
    timestamps: true
});
// Exclude soft-deleted users from basic queries
userSchema.pre(/^find/, function (next) {
    const query = this;
    query.find({ deletedAt: { $eq: null } });
    next();
});
exports.default = mongoose_1.default.model('User', userSchema);
