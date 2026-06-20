"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAnalyticsSchema = exports.wateringRecommendationSchema = exports.lightRecommendationSchema = exports.paginationQuerySchema = exports.wateringHistorySchema = exports.lightMeterHistorySchema = void 0;
var zod_1 = require("zod");
var mongoose_1 = __importDefault(require("mongoose"));
var objectIdSchema = zod_1.z.string().refine(function (val) { return mongoose_1.default.Types.ObjectId.isValid(val); }, {
    message: "Invalid ObjectId",
});
exports.lightMeterHistorySchema = zod_1.z.object({
    body: zod_1.z.object({
        plantId: zod_1.z.string().trim().optional(),
        plantLibraryId: objectIdSchema.optional(),
        lux: zod_1.z.number().min(0, 'Lux must be >= 0'),
        zone: zod_1.z.enum(['dark', 'low', 'normal', 'bright']),
        clientOperationId: zod_1.z.string().trim().optional(),
        source: zod_1.z.enum(['local', 'server']).optional(),
    })
});
exports.wateringHistorySchema = zod_1.z.object({
    body: zod_1.z.object({
        plantType: zod_1.z.string().trim().optional(),
        plantLibraryId: objectIdSchema.optional(),
        potSize: zod_1.z.string().trim().min(1, 'Pot size is required'),
        season: zod_1.z.string().trim().min(1, 'Season is required'),
        location: zod_1.z.string().trim().min(1, 'Location is required'),
        days: zod_1.z.number().min(1, 'Days must be >= 1'),
        volumeMl: zod_1.z.number().min(0, 'Volume must be >= 0'),
        clientOperationId: zod_1.z.string().trim().optional(),
        source: zod_1.z.enum(['local', 'server']).optional(),
    })
});
exports.paginationQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        cursor: zod_1.z.string().optional(),
        limit: zod_1.z.string()
            .regex(/^\d+$/)
            .transform(Number)
            .refine(function (n) { return n > 0 && n <= 50; }, { message: 'Limit must be between 1 and 50' })
            .optional(),
    })
});
exports.lightRecommendationSchema = zod_1.z.object({
    params: zod_1.z.object({
        plantId: zod_1.z.string().trim().min(1, 'Plant ID is required')
    })
});
exports.wateringRecommendationSchema = zod_1.z.object({
    query: zod_1.z.object({
        plantType: zod_1.z.string().trim().optional(),
        plantId: zod_1.z.string().trim().optional(),
        potSize: zod_1.z.string().trim().min(1, 'Pot size is required'),
        season: zod_1.z.string().trim().min(1, 'Season is required'),
        location: zod_1.z.string().trim().min(1, 'Location is required'),
    })
});
exports.adminAnalyticsSchema = zod_1.z.object({
    query: zod_1.z.object({
        from: zod_1.z.string().datetime().optional(),
        to: zod_1.z.string().datetime().optional(),
        timeZone: zod_1.z.string().optional()
    })
});
