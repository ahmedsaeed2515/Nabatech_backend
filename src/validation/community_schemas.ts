import { z } from 'zod';

export const feedQuerySchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    category: z.string().optional(),
    status: z.enum(['visible', 'hidden', 'removed', 'all']).optional(),
    authorId: z.string().optional(),
  }),
});

export const searchQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().min(1).max(100).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"),
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(10),
    category: z.string().optional(),
    plantTag: z.string().optional(),
  }),
});

export const trendingQuerySchema = z.object({
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(50).default(10),
  }),
});

export const createPostSchema = z.object({
  body: z.object({
    title: z.string().trim().min(6).max(200).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"),
    content: z.string().trim().min(12).max(5000).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"),
    plantTag: z.enum(['Diagnosis', 'Care Tips', 'Watering', 'Pests', 'General']),
    clientOperationId: z.string().min(1).max(100),
    linkedDiagnosisId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid diagnosis ID format').optional(),
    pollQuestion: z.string().trim().min(5).max(300).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed").optional(),
    pollOptions: z.union([
      z.string(),
      z.array(z.string().trim().min(1).max(100).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"))
    ]).optional(),
  }).refine((data) => {
    if (data.pollQuestion) {
      if (!data.pollOptions) return false;
      const options = Array.isArray(data.pollOptions) ? data.pollOptions : [data.pollOptions];
      if (options.length < 2 || options.length > 10) return false;
      const uniqueOptions = new Set(options.map(o => o.toLowerCase()));
      if (uniqueOptions.size !== options.length) return false;
    }
    return true;
  }, {
    message: "If a poll is provided, there must be between 2 and 10 unique poll options",
    path: ["pollOptions"],
  }),
  // file validation is handled by upload_middleware but we can validate its presence if needed
});

export const toggleLikeSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
  }),
  body: z.object({
    liked: z.boolean(),
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
    text: z.string().trim().min(1).max(2000).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"),
    clientOperationId: z.string().min(1).max(100),
    parentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent comment ID format').optional().nullable(),
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

export const updatePostSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
  }),
  body: z.object({
    title: z.string().trim().min(6).max(200).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed").optional(),
    content: z.string().trim().min(12).max(5000).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed").optional(),
    plantTag: z.enum(['Diagnosis', 'Care Tips', 'Watering', 'Pests', 'General']).optional(),
  }),
});

export const updateCommentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
    commentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid comment ID format').optional(),
  }),
  body: z.object({
    text: z.string().trim().min(1).max(1000).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"),
  }),
});

export const deleteCommentSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
    commentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid comment ID format').optional(),
  }),
});
