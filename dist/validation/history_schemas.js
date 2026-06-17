"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDiagnosisAnalyticsQuerySchema = exports.adminDiagnosisQuerySchema = exports.clearHistoryQuerySchema = exports.updateFeedbackSchema = exports.historyQuerySchema = void 0;
const zod_1 = require("zod");
exports.historyQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.coerce.number().int().min(1).max(50).optional().default(20),
        feedbackStatus: zod_1.z.enum(["pending", "confirmed", "rejected"]).optional(),
    }),
});
exports.updateFeedbackSchema = zod_1.z.object({
    body: zod_1.z.object({
        status: zod_1.z.enum(["pending", "confirmed", "rejected"]),
        version: zod_1.z.number().int().optional(),
    }),
});
exports.clearHistoryQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        before: zod_1.z.string().datetime().optional(),
    }),
});
exports.adminDiagnosisQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        page: zod_1.z.coerce.number().int().min(1).optional().default(1),
        limit: zod_1.z.coerce.number().int().min(1).max(100).optional().default(20),
        from: zod_1.z.string().datetime().optional(),
        to: zod_1.z.string().datetime().optional(),
        severity: zod_1.z.enum(["low", "medium", "high", "منخفضة", "متوسطة", "عالية"]).optional(),
        feedbackStatus: zod_1.z.enum(["pending", "confirmed", "rejected"]).optional(),
    }),
});
exports.adminDiagnosisAnalyticsQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        from: zod_1.z.string().datetime().optional(),
        to: zod_1.z.string().datetime().optional(),
        timeZone: zod_1.z.string().optional().default("UTC"),
    }),
});
