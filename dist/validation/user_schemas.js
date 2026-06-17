"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFcmTokenSchema = exports.updateUserRoleSchema = exports.changePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
const passwordSchema = zod_1.z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[a-zA-Z]/, 'Password must contain letters')
    .regex(/[0-9]/, 'Password must contain numbers');
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().trim().min(1, 'Name cannot be empty').optional(),
        phoneNumber: zod_1.z.string().trim().optional(),
        selectedCountry: zod_1.z.string().trim().optional(),
        avatarUrl: zod_1.z.string().url('Invalid URL format').optional().or(zod_1.z.literal('')),
        preferences: zod_1.z.object({
            theme: zod_1.z.enum(['light', 'dark', 'system']).optional(),
            language: zod_1.z.string().optional(),
            notificationsEnabled: zod_1.z.boolean().optional(),
        }).optional(),
    })
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: passwordSchema
    })
});
exports.updateUserRoleSchema = zod_1.z.object({
    body: zod_1.z.object({
        role: zod_1.z.enum(['user', 'moderator', 'admin', 'super_admin'], {
            message: "Invalid role specified"
        })
    })
});
exports.updateFcmTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Token is required')
    })
});
