"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutSchema = exports.refreshTokenSchema = exports.resendVerificationSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
var zod_1 = require("zod");
// password must be at least 6 characters and contain both letters and numbers
var passwordSchema = zod_1.z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/[a-zA-Z]/, 'Password must contain letters')
    .regex(/[0-9]/, 'Password must contain numbers');
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().trim().min(1, 'Name is required'),
        email: zod_1.z.string().trim().email('Invalid email format').toLowerCase(),
        password: passwordSchema,
        phoneNumber: zod_1.z.string().trim().optional(),
    })
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().trim().email('Invalid email format').toLowerCase(),
        password: zod_1.z.string().min(1, 'Password is required'),
        deviceId: zod_1.z.string().optional()
    })
});
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().trim().email('Invalid email format').toLowerCase()
    })
});
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Token is required'),
        newPassword: passwordSchema
    })
});
exports.resendVerificationSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().trim().email('Invalid email format').toLowerCase()
    })
});
exports.refreshTokenSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
        deviceId: zod_1.z.string().optional()
    })
});
exports.logoutSchema = zod_1.z.object({
    body: zod_1.z.object({
        refreshToken: zod_1.z.string().optional()
    })
});
