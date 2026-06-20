"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminOffersQuerySchema = exports.offersQuerySchema = exports.adminModerationSchema = exports.updateOfferStatusSchema = exports.createOfferSchema = void 0;
var zod_1 = require("zod");
var objectIdRegex = /^[0-9a-fA-F]{24}$/;
exports.createOfferSchema = zod_1.z.object({
    body: zod_1.z.object({
        postId: zod_1.z.string().regex(objectIdRegex, 'Invalid post ID format'),
        plan: zod_1.z.string().min(1),
        price: zod_1.z.number().min(0),
        clientOperationId: zod_1.z.string().min(1),
    }),
});
exports.updateOfferStatusSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, 'Invalid offer ID format'),
    }),
    body: zod_1.z.object({
        status: zod_1.z.enum(['accepted', 'rejected', 'cancelled']),
        version: zod_1.z.number().int().nonnegative(),
    }),
});
exports.adminModerationSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().regex(objectIdRegex, 'Invalid offer ID format'),
    }),
    body: zod_1.z.object({
        action: zod_1.z.enum(['flag', 'clear', 'void']),
        reason: zod_1.z.string().optional(),
        version: zod_1.z.number().int().nonnegative(),
    }),
});
exports.offersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
        status: zod_1.z.enum(['pending', 'accepted', 'rejected', 'cancelled']).optional(),
    }),
});
exports.adminOffersQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).default(20),
        status: zod_1.z.enum(['pending', 'accepted', 'rejected', 'cancelled']).optional(),
        adminStatus: zod_1.z.enum(['flagged', 'cleared', 'voided']).optional(),
        farmerId: zod_1.z.string().regex(objectIdRegex, 'Invalid farmer ID format').optional(),
        specialistId: zod_1.z.string().regex(objectIdRegex, 'Invalid specialist ID format').optional(),
    }),
});
