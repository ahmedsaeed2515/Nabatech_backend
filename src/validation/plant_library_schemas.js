"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImportRequestSchema = exports.DiseaseImportRowSchema = exports.PlantImportRowSchema = exports.DiseaseUpdateSchema = exports.DiseaseCreateSchema = exports.PlantUpdateSchema = exports.PlantCreateSchema = void 0;
var zod_1 = require("zod");
// ------------------- Plant Schemas -------------------
exports.PlantCreateSchema = zod_1.z.object({
    nameAr: zod_1.z.string().min(1),
    nameEn: zod_1.z.string().min(1),
    scientificName: zod_1.z.string().optional(),
    imageUrl: zod_1.z.string().url().optional(),
    category: zod_1.z.string().optional(),
    careLevel: zod_1.z.enum(['easy', 'medium', 'hard']).optional(),
    descriptionAr: zod_1.z.string().optional(),
    descriptionEn: zod_1.z.string().optional(),
    waterRequirements: zod_1.z.string().optional(),
    lightRequirements: zod_1.z.string().optional(),
    humidityRequirements: zod_1.z.string().optional(),
    soilRequirements: zod_1.z.string().optional(),
    fertilizerRequirements: zod_1.z.string().optional(),
    growthRate: zod_1.z.string().optional(),
    matureSize: zod_1.z.string().optional(),
    temperatureRange: zod_1.z.string().optional(),
    toxicityLevel: zod_1.z.string().optional(),
    wateringFrequency: zod_1.z.string().optional(),
    careInstructions: zod_1.z.string().optional(),
    commonProblems: zod_1.z.string().optional(),
    propagationMethod: zod_1.z.string().optional(),
    nativeRegion: zod_1.z.string().optional(),
    plantBenefits: zod_1.z.string().optional(),
});
exports.PlantUpdateSchema = exports.PlantCreateSchema.partial();
// ------------------- Disease Schemas -------------------
exports.DiseaseCreateSchema = zod_1.z.object({
    nameAr: zod_1.z.string().min(1),
    nameEn: zod_1.z.string().min(1),
    imageUrl: zod_1.z.string().url().optional(),
    severity: zod_1.z.enum(['low', 'medium', 'high']).optional(),
    type: zod_1.z.enum(['Fungal', 'Bacterial', 'Viral', 'Pest']).optional(),
    affectedPlantsCount: zod_1.z.number().int().nonnegative().optional(),
    descriptionAr: zod_1.z.string().optional(),
    descriptionEn: zod_1.z.string().optional(),
});
exports.DiseaseUpdateSchema = exports.DiseaseCreateSchema.partial();
// ------------------- Bulk Import Schemas -------------------
exports.PlantImportRowSchema = exports.PlantCreateSchema.extend({
    slug: zod_1.z.string().min(1),
});
exports.DiseaseImportRowSchema = exports.DiseaseCreateSchema.extend({
    slug: zod_1.z.string().min(1),
});
exports.ImportRequestSchema = zod_1.z.object({
    kind: zod_1.z.enum(['plants', 'diseases']),
    rows: zod_1.z.array(zod_1.z.union([exports.PlantImportRowSchema, exports.DiseaseImportRowSchema])).max(500),
});
