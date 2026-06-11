import { z } from 'zod';

// ------------------- Plant Schemas -------------------
export const PlantCreateSchema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  scientificName: z.string().optional(),
  imageUrl: z.string().url().optional(),
  category: z.string().optional(),
  careLevel: z.enum(['easy', 'medium', 'hard']).optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
});

export const PlantUpdateSchema = PlantCreateSchema.partial();

// ------------------- Disease Schemas -------------------
export const DiseaseCreateSchema = z.object({
  nameAr: z.string().min(1),
  nameEn: z.string().min(1),
  imageUrl: z.string().url().optional(),
  severity: z.enum(['low', 'medium', 'high']).optional(),
  type: z.enum(['Fungal', 'Bacterial', 'Viral', 'Pest']).optional(),
  affectedPlantsCount: z.number().int().nonnegative().optional(),
  descriptionAr: z.string().optional(),
  descriptionEn: z.string().optional(),
});

export const DiseaseUpdateSchema = DiseaseCreateSchema.partial();

// ------------------- Bulk Import Schemas -------------------
export const PlantImportRowSchema = PlantCreateSchema.extend({
  slug: z.string().min(1),
});

export const DiseaseImportRowSchema = DiseaseCreateSchema.extend({
  slug: z.string().min(1),
});

export const ImportRequestSchema = z.object({
  kind: z.enum(['plants', 'diseases']),
  rows: z.array(z.union([PlantImportRowSchema, DiseaseImportRowSchema])).max(500),
});
