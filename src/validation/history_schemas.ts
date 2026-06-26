import { z } from "zod";

export const historyQuerySchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional().default(20),
    feedbackStatus: z.enum(["pending", "confirmed", "rejected"]).optional(),
  }),
});

export const updateFeedbackSchema = z.object({
  body: z.object({
    status: z.enum(["pending", "confirmed", "rejected"]),
    version: z.number().int().optional(),
  }),
});

export const clearHistoryQuerySchema = z.object({
  query: z.object({
    before: z.string().datetime().optional(),
  }),
});

export const adminDiagnosisQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    severity: z.enum(["low", "medium", "high", "منخفضة", "متوسطة", "عالية"]).optional(),
    feedbackStatus: z.enum(["pending", "confirmed", "rejected"]).optional(),
  }),
});

export const adminDiagnosisAnalyticsQuerySchema = z.object({
  query: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    timeZone: z.string().optional().default("UTC"),
  }),
});


