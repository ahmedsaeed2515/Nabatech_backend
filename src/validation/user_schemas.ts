import { z } from 'zod';

const passwordSchema = z.string()
  .min(6, 'Password must be at least 6 characters')
  .regex(/[a-zA-Z]/, 'Password must contain letters')
  .regex(/[0-9]/, 'Password must contain numbers');

export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z.string().trim().min(1, 'Name cannot be empty').optional(),
    phoneNumber: z.string().trim().optional(),
    selectedCountry: z.string().trim().optional(),
    avatarUrl: z.string().url('Invalid URL format').optional().or(z.literal('')),
    preferences: z.object({
      theme: z.enum(['light', 'dark', 'system']).optional(),
      language: z.string().optional(),
      notificationsEnabled: z.boolean().optional(),
    }).optional(),
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema
  })
});

export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['user', 'moderator', 'admin', 'super_admin'], {
      message: "Invalid role specified"
    })
  })
});

export const updateFcmTokenSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Token is required')
  })
});
