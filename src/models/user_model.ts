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
  status?: string;
  tokenVersion?: number;
  emailVerificationToken?: string;
  refreshToken?: string;
  emailVerificationTokenHash?: string;
  emailVerificationExpiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const userSchema = new mongoose.Schema<User>({
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
userSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<User>('User', userSchema);
