import { z } from 'zod';
import mongoose from 'mongoose';

export const arScanCreateSchema = z.object({
  body: z.object({
    mode: z.enum(['identify', 'measure', 'placement', 'diagnosis_overlay']),
    label: z.string().trim().min(1, 'Label is required'),
    clientOperationId: z.string().trim().optional(),
    deviceModel: z.string().trim().optional(),
    appVersion: z.string().trim().optional(),
    modelId: z.string().trim().optional(),
    confidence: z.number().min(0).max(1).optional(),
  })
});

export const arScanListSchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.string()
      .regex(/^\d+$/)
      .transform(Number)
      .refine(n => n > 0 && n <= 50, { message: 'Limit must be between 1 and 50' })
      .optional(),
    mode: z.enum(['identify', 'measure', 'placement', 'diagnosis_overlay']).optional(),
  })
});
