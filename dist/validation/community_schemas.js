"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCommentSchema = exports.updateCommentSchema = exports.updatePostSchema = exports.adminModerationSchema = exports.adminCommunityQuerySchema = exports.createCommentSchema = exports.commentsQuerySchema = exports.deletePostSchema = exports.toggleLikeSchema = exports.createPostSchema = exports.trendingQuerySchema = exports.searchQuerySchema = exports.feedQuerySchema = void 0;
const zod_1 = require("zod");
exports.feedQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
        category: zod_1.z.string().optional(),
        status: zod_1.z.enum(['visible', 'hidden', 'removed', 'all']).optional(),
        authorId: zod_1.z.string().optional(),
    }),
});
exports.searchQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        q: zod_1.z.string().trim().min(1).max(100).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"),
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
        category: zod_1.z.string().optional(),
        plantTag: zod_1.z.string().optional(),
    }),
});
exports.trendingQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(10),
    }),
});
exports.createPostSchema = zod_1.z.object({
    body: zod_1.z.object({
        title: zod_1.z.string().trim().min(6).max(200).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"),
        content: zod_1.z.string().trim().min(12).max(5000).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"),
        plantTag: zod_1.z.enum(['Diagnosis', 'Care Tips', 'Watering', 'Pests', 'General']),
        clientOperationId: zod_1.z.string().min(1).max(100),
        linkedDiagnosisId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid diagnosis ID format').optional(),
        pollQuestion: zod_1.z.string().trim().min(5).max(300).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed").optional(),
        pollOptions: zod_1.z.union([
            zod_1.z.string(),
            zod_1.z.array(zod_1.z.string().trim().min(1).max(100).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"))
        ]).optional(),
    }).refine((data) => {
        if (data.pollQuestion) {
            if (!data.pollOptions)
                return false;
            const options = Array.isArray(data.pollOptions) ? data.pollOptions : [data.pollOptions];
            if (options.length < 2 || options.length > 10)
                return false;
            const uniqueOptions = new Set(options.map(o => o.toLowerCase()));
            if (uniqueOptions.size !== options.length)
                return false;
        }
        return true;
    }, {
        message: "If a poll is provided, there must be between 2 and 10 unique poll options",
        path: ["pollOptions"],
    }),
    // file validation is handled by upload_middleware but we can validate its presence if needed
});
exports.toggleLikeSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
    }),
    body: zod_1.z.object({
        liked: zod_1.z.boolean(),
        clientOperationId: zod_1.z.string().optional(),
    }).optional(),
});
exports.deletePostSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
    }),
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
        text: zod_1.z.string().trim().min(1).max(2000).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"),
        clientOperationId: zod_1.z.string().min(1).max(100),
        parentId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid parent comment ID format').optional().nullable(),
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
exports.updatePostSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
    }),
    body: zod_1.z.object({
        title: zod_1.z.string().trim().min(6).max(200).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed").optional(),
        content: zod_1.z.string().trim().min(12).max(5000).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed").optional(),
        plantTag: zod_1.z.enum(['Diagnosis', 'Care Tips', 'Watering', 'Pests', 'General']).optional(),
    }),
});
exports.updateCommentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
        commentId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid comment ID format').optional(),
    }),
    body: zod_1.z.object({
        text: zod_1.z.string().trim().min(1).max(1000).regex(/^(?!.*<[^>]+>).*/s, "HTML tags are not allowed"),
    }),
});
exports.deleteCommentSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid post ID format'),
        commentId: zod_1.z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid comment ID format').optional(),
    }),
});
