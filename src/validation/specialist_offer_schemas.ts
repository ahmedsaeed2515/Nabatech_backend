import { z } from 'zod';

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const createOfferSchema = z.object({
  body: z.object({
    postId: z.string().regex(objectIdRegex, 'Invalid post ID format'),
    plan: z.string().min(1),
    price: z.number().min(0),
    clientOperationId: z.string().min(1),
  }),
});

export const updateOfferStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid offer ID format'),
  }),
  body: z.object({
    status: z.enum(['accepted', 'rejected', 'withdrawn', 'cancelled']),
    version: z.number().int().nonnegative(),
    clientOperationId: z.string().min(1).optional(),
  }),
});

export const adminModerationSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, 'Invalid offer ID format'),
  }),
  body: z.object({
    action: z.enum(['flag', 'clear', 'void']),
    reason: z.string().optional(),
    version: z.number().int().nonnegative(),
  }),
});

export const offersQuerySchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(['pending', 'accepted', 'rejected', 'withdrawn', 'cancelled']).optional(),
  }),
});

export const adminOffersQuerySchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(['pending', 'accepted', 'rejected', 'withdrawn', 'cancelled']).optional(),
    adminStatus: z.enum(['flagged', 'cleared', 'voided']).optional(),
    farmerId: z.string().regex(objectIdRegex, 'Invalid farmer ID format').optional(),
    specialistId: z.string().regex(objectIdRegex, 'Invalid specialist ID format').optional(),
  }),
});
