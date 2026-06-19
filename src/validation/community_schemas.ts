import { z } from 'zod';

export const feedQuerySchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(20).default(10),
    category: z.string().optional(),
    status: z.enum(['visible', 'hidden', 'removed', 'all']).optional(),
    authorId: z.string().optional(),
  }),
});

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().min(5),
    content: z.string().min(10),
    plantTag: z.enum(['Diagnosis', 'Care Tips', 'Watering', 'Pests', 'General']),
    clientOperationId: z.string().min(1),
    linkedDiagnosisId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid diagnosis ID format').optional(),
  }),
  // file validation is handled by upload_middleware but we can validate its presence if needed
});

export const toggleLikeSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
  }),
  body: z.object({
    clientOperationId: z.string().optional(),
  }).optional(),
});

export const deletePostSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
  }),
});

export const commentsQuerySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
  }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  }),
});

export const createCommentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
  }),
  body: z.object({
    text: z.string().min(1),
    clientOperationId: z.string().min(1),
  }),
});

export const adminCommunityQuerySchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    status: z.enum(['visible', 'hidden', 'removed', 'all']).optional(),
    authorId: z.string().optional(),
    postId: z.string().optional(),
  }),
});

export const adminModerationSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
  }),
  body: z.object({
    action: z.enum(['approve', 'hide', 'restore', 'remove']), // Including 'remove' as standard mapping for 'removed'
    reason: z.string().optional(),
    version: z.number().int().nonnegative(),
  }),
});
