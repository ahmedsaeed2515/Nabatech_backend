import mongoose, { Document } from "mongoose";

export enum UserLevel {
  SPROUT = 'Sprout',
  GARDENER = 'Gardener',
  BOTANIST = 'Botanist'
}

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin'
}

export interface User extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  fcmToken?: string;
  level: UserLevel;
  pushEnabled: boolean;
  autoAddEnabled: boolean;
  latitude?: number;
  longitude?: number;
  name?: string;
  phoneNumber?: string;
  selectedCountry?: string;
  avatarUrl?: string;
  preferences?: any;
  password?: string;
  status: string;
  tokenVersion: number;
  emailVerified: boolean;
  emailVerificationToken?: string;
  refreshToken?: string;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const userSchema = new mongoose.Schema<User>({
  // ── Core credentials ──────────────────────────────────────────────────────
  email:        { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  /** Legacy field — always use passwordHash; excluded from query results */
  password:     { type: String, select: false },

  // ── Profile (were missing → Mongoose strict mode silently discarded them) ─
  name:            { type: String, trim: true },
  phoneNumber:     { type: String, trim: true },
  selectedCountry: { type: String, trim: true },
  avatarUrl:       { type: String, trim: true },
  preferences:     { type: mongoose.Schema.Types.Mixed, default: {} },

  // ── Role / Level / Settings ───────────────────────────────────────────────
  role:          { type: String, enum: Object.values(UserRole),  default: UserRole.USER },
  level:         { type: String, enum: Object.values(UserLevel), default: UserLevel.SPROUT },
  pushEnabled:    { type: Boolean, default: true },
  autoAddEnabled: { type: Boolean, default: true },
  fcmToken:       { type: String },

  // ── Location ──────────────────────────────────────────────────────────────
  latitude:  { type: Number },
  longitude: { type: Number },

  // ── Account status & session security ─────────────────────────────────────
  /** 'active' | 'disabled' | 'pending_verification' */
  status:       { type: String, enum: ['active', 'disabled', 'pending_verification'], default: 'active' },
  tokenVersion: { type: Number, default: 0 },

  // ── Email verification ────────────────────────────────────────────────────
  emailVerified:              { type: Boolean, default: false },
  emailVerificationTokenHash: { type: String, select: false },
  emailVerificationToken:     { type: String, select: false }, // legacy
  emailVerificationExpiresAt: { type: Date },

  // ── Refresh token (legacy — superseded by RefreshSession collection) ───────
  refreshToken: { type: String, select: false },

  // ── Soft-delete ───────────────────────────────────────────────────────────
  deletedAt: { type: Date, default: null }
}, {
  timestamps: true
});

// ── Indexes ───────────────────────────────────────────────────────────────────
// Auth lookups: (email, status) covers login + status-check in one DB round trip
userSchema.index({ email: 1, status: 1 });
// Admin role-filter queries
userSchema.index({ role: 1 });
// Soft-delete filter used in the global pre-find hook
userSchema.index({ deletedAt: 1 });

// ── Global pre-find hook: exclude soft-deleted users from all queries ──────────
userSchema.pre(/^find/, function (next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<User>('User', userSchema);
