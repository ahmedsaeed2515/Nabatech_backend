import { z } from 'zod';

// password must be at least 6 characters and contain both letters and numbers
const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .regex(/[a-zA-Z]/, 'Password must contain letters')
  .regex(/[0-9]/, 'Password must contain numbers');

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    email: z.string().trim().email('Invalid email format').toLowerCase(),
    password: passwordSchema,
    phoneNumber: z.string().trim().optional(),
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email format').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
    deviceId: z.string().optional()
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email format').toLowerCase()
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required'),
    newPassword: passwordSchema
  })
});

export const resendVerificationSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email format').toLowerCase()
  })
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
    deviceId: z.string().optional()
  })
});

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional()
  })
});


