"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateInventoryItemSchema = exports.createInventoryItemSchema = exports.updateWishlistItemSchema = exports.createWishlistItemSchema = exports.chatMessageSchema = exports.growthMeasurementSchema = exports.dailyTasksSchema = exports.fertilizerSchema = exports.careActionSchema = exports.createPlantSchema = exports.createZoneSchema = exports.createGardenSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const garden_model_1 = require("../models/garden_model");
const zone_model_1 = require("../models/zone_model");
exports.registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6),
});
exports.createGardenSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(garden_model_1.GardenType),
});
exports.createZoneSchema = zod_1.z.object({
    name: zod_1.z.string().min(1),
    type: zod_1.z.nativeEnum(zone_model_1.ZoneType),
});
exports.createPlantSchema = zod_1.z.object({
    zoneId: zod_1.z.string().min(1, "zoneId is required"),
    dnaId: zod_1.z.string().min(1, "dnaId is required"),
    name: zod_1.z.string().min(1, "name is required")
});
exports.careActionSchema = zod_1.z.object({
    type: zod_1.z.enum(['WATER', 'PRUNE', 'MIST', 'REPOTTING', 'OTHER']),
    date: zod_1.z.string().datetime().optional(),
    notes: zod_1.z.string().optional()
});
exports.fertilizerSchema = zod_1.z.object({
    type: zod_1.z.enum(['LIQUID', 'GRANULAR', 'SLOW_RELEASE', 'ORGANIC']),
    amount: zod_1.z.string().min(1, "amount is required"),
    date: zod_1.z.string().datetime().optional()
});
exports.dailyTasksSchema = zod_1.z.object({
    date: zod_1.z.string().datetime()
});
exports.growthMeasurementSchema = zod_1.z.object({
    heightCm: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().positive().optional()),
    leafCount: zod_1.z.preprocess((val) => Number(val), zod_1.z.number().int().nonnegative().optional()),
    stage: zod_1.z.enum(['SEED', 'SPROUT', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURE', 'DEAD']).optional()
}).refine(data => data.heightCm !== undefined || data.leafCount !== undefined || data.stage !== undefined, {
    message: "At least one measurement (heightCm, leafCount, or stage) is required"
});
exports.chatMessageSchema = zod_1.z.object({
    body: zod_1.z.object({
        message: zod_1.z.string().min(1, 'Message is required').max(1000, 'Message is too long')
    })
});
exports.createWishlistItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        species: zod_1.z.string().min(2, 'Species name is too short').max(100, 'Species name is too long'),
        notes: zod_1.z.string().max(500, 'Notes too long').optional()
    })
});
exports.updateWishlistItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        species: zod_1.z.string().min(2).max(100).optional(),
        notes: zod_1.z.string().max(500).optional()
    })
});
exports.createInventoryItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(['POT', 'TOOL', 'FERTILIZER']),
        name: zod_1.z.string().min(2).max(100),
        qty: zod_1.z.number().int().min(1)
    })
});
exports.updateInventoryItemSchema = zod_1.z.object({
    body: zod_1.z.object({
        type: zod_1.z.enum(['POT', 'TOOL', 'FERTILIZER']).optional(),
        name: zod_1.z.string().min(2).max(100).optional(),
        qty: zod_1.z.number().int().min(0).optional()
    })
});
