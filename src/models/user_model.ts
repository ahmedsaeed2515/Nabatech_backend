import mongoose ,{Document}from "mongoose";

export interface User extends Document {
    name: string;
    email: string;
    password: string;  
    updatedAt: Date;
    createdAt: Date;      
    role?: "user" | "admin";
    status: 'active' | 'disabled';
    tokenVersion: number;
    accountType: 'farmer' | 'specialist';
    specialistVerifiedAt?: Date;
    avatarUrl?: string;        
    phoneNumber?: string;
    selectedCountry?: string;
    refreshToken?: string; // Legacy
    emailVerified: boolean;
    emailVerificationToken?: string; // Legacy
    emailVerificationTokenHash?: string;
    emailVerificationExpiresAt?: Date;
    fcmToken?: string;
    preferences?: {
        theme: string;
        language: string;
        notificationsEnabled: boolean;
    };
}

const userSchema = new mongoose.Schema<User>({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    tokenVersion: { type: Number, default: 0 },
    accountType: { type: String, enum: ['farmer', 'specialist'], default: 'farmer' },
    specialistVerifiedAt: { type: Date },
    avatarUrl: { type: String , default: ""},
    phoneNumber: { type: String, required: false },
    selectedCountry: { type: String, required: false, default: "" },
    refreshToken: { type: String, required: false, default: null }, // Legacy
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String, required: false, default: null }, // Legacy
    emailVerificationTokenHash: { type: String },
    emailVerificationExpiresAt: { type: Date },
    fcmToken: { type: String, required: false },
    preferences: {
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        language: { type: String, default: 'en' },
        notificationsEnabled: { type: Boolean, default: true }
    }
},
    {timestamps: true}
);

export default mongoose.model<User>('User', userSchema);