"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminModerationSchema = exports.adminCommunityQuerySchema = exports.createCommentSchema = exports.commentsQuerySchema = exports.toggleLikeSchema = exports.createPostSchema = exports.feedQuerySchema = void 0;
const zod_1 = require("zod");
exports.feedQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(20).default(10),
        category: zod_1.z.string().optional(),
        status: zod_1.z.enum(['visible', 'hidden', 'removed', 'all']).optional(),
    }),
});
exports.createPostSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().min(5),
        content: zod_1.z.string().min(10),
        plantTag: zod_1.z.enum(['Diagnosis', 'Care Tips', 'Watering', 'Pests', 'General']),
        clientOperationId: zod_1.z.string().min(1),
    }),
    // file validation is handled by upload_middleware but we can validate its presence if needed
});
exports.toggleLikeSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
    }),
    body: zod_1.z.object({
        clientOperationId: zod_1.z.string().optional(),
    }).optional(),
});
exports.commentsQuerySchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
    }),
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
    }),
});
exports.createCommentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
    }),
    body: zod_1.z.object({
        text: zod_1.z.string().min(1),
        clientOperationId: zod_1.z.string().min(1),
    }),
});
exports.adminCommunityQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
        status: zod_1.z.enum(['visible', 'hidden', 'removed', 'all']).optional(),
        authorId: zod_1.z.string().optional(),
        postId: zod_1.z.string().optional(),
    }),
});
exports.adminModerationSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format'),
    }),
    body: zod_1.z.object({
        action: zod_1.z.enum(['approve', 'hide', 'restore', 'remove']), // Including 'remove' as standard mapping for 'removed'
        reason: zod_1.z.string().optional(),
        version: zod_1.z.number().int().nonnegative(),
    }),
});
