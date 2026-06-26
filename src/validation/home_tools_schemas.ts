import { z } from 'zod';
import mongoose from 'mongoose';

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
  message: "Invalid ObjectId",
});

export const lightMeterHistorySchema = z.object({
  body: z.object({
    plantId: z.string().trim().optional(),
    plantLibraryId: objectIdSchema.optional(),
    lux: z.number().min(0, 'Lux must be >= 0'),
    zone: z.enum(['dark', 'low', 'normal', 'bright']),
    clientOperationId: z.string().trim().optional(),
    source: z.enum(['local', 'server']).optional(),
  })
});

export const wateringHistorySchema = z.object({
  body: z.object({
    plantType: z.string().trim().optional(),
    plantLibraryId: objectIdSchema.optional(),
    potSize: z.string().trim().min(1, 'Pot size is required'),
    season: z.string().trim().min(1, 'Season is required'),
    location: z.string().trim().min(1, 'Location is required'),
    days: z.number().min(1, 'Days must be >= 1'),
    volumeMl: z.number().min(0, 'Volume must be >= 0'),
    clientOperationId: z.string().trim().optional(),
    source: z.enum(['local', 'server']).optional(),
  })
});

export const paginationQuerySchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.string()
      .regex(/^\d+$/)
      .transform(Number)
      .refine(n => n > 0 && n <= 50, { message: 'Limit must be between 1 and 50' })
      .optional(),
  })
});

export const lightRecommendationSchema = z.object({
  params: z.object({
    plantId: z.string().trim().min(1, 'Plant ID is required')
  })
});

export const wateringRecommendationSchema = z.object({
  query: z.object({
    plantType: z.string().trim().optional(),
    plantId: z.string().trim().optional(),
    potSize: z.string().trim().min(1, 'Pot size is required'),
    season: z.string().trim().min(1, 'Season is required'),
    location: z.string().trim().min(1, 'Location is required'),
  })
});

export const adminAnalyticsSchema = z.object({
  query: z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    timeZone: z.string().optional()
  })
});


