"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.arScanListSchema = exports.arScanCreateSchema = void 0;
const zod_1 = require("zod");
exports.arScanCreateSchema = zod_1.z.object({
    body: zod_1.z.object({
        mode: zod_1.z.enum(['identify', 'measure', 'placement', 'diagnosis_overlay']),
        label: zod_1.z.string().trim().min(1, 'Label is required'),
        clientOperationId: zod_1.z.string().trim().optional(),
        deviceModel: zod_1.z.string().trim().optional(),
        appVersion: zod_1.z.string().trim().optional(),
        modelId: zod_1.z.string().trim().optional(),
        confidence: zod_1.z.number().min(0).max(1).optional(),
    })
});
exports.arScanListSchema = zod_1.z.object({
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .refine(n => n > 0 && n <= 50, { message: 'Limit must be between 1 and 50' })
            .optional(),
        mode: zod_1.z.enum(['identify', 'measure', 'placement', 'diagnosis_overlay']).optional(),
    })
});
