import { z } from 'zod';
import { GardenType } from '../models/garden_model';
import { ZoneType } from '../models/zone_model';

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const createGardenSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(GardenType),
});

export const createZoneSchema = z.object({
  name: z.string().min(1),
  type: z.nativeEnum(ZoneType),
});

export const createPlantSchema = z.object({
  zoneId: z.string().min(1, "zoneId is required"),
  dnaId: z.string().min(1, "dnaId is required"),
  name: z.string().min(1, "name is required")
});

export const careActionSchema = z.object({
  type: z.enum(['WATER', 'PRUNE', 'MIST', 'REPOTTING', 'OTHER']),
  date: z.string().datetime().optional(),
  notes: z.string().optional()
});

export const fertilizerSchema = z.object({
  type: z.enum(['LIQUID', 'GRANULAR', 'SLOW_RELEASE', 'ORGANIC']),
  amount: z.string().min(1, "amount is required"),
  date: z.string().datetime().optional()
});

export const dailyTasksSchema = z.object({
  date: z.string().datetime()
});

export const growthMeasurementSchema = z.object({
  heightCm: z.preprocess((val) => Number(val), z.number().positive().optional()),
  leafCount: z.preprocess((val) => Number(val), z.number().int().nonnegative().optional()),
  stage: z.enum(['SEED', 'SPROUT', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURE', 'DEAD']).optional()
}).refine(data => data.heightCm !== undefined || data.leafCount !== undefined || data.stage !== undefined, {
  message: "At least one measurement (heightCm, leafCount, or stage) is required"
});

export const chatMessageSchema = z.object({
  body: z.object({
    message: z.string().min(1, 'Message is required').max(1000, 'Message is too long')
  })
});

export const createWishlistItemSchema = z.object({
  body: z.object({
    species: z.string().min(2, 'Species name is too short').max(100, 'Species name is too long'),
    notes: z.string().max(500, 'Notes too long').optional()
  })
});

export const updateWishlistItemSchema = z.object({
  body: z.object({
    species: z.string().min(2).max(100).optional(),
    notes: z.string().max(500).optional()
  })
});

export const createInventoryItemSchema = z.object({
  body: z.object({
    type: z.enum(['POT', 'TOOL', 'FERTILIZER']),
    name: z.string().min(2).max(100),
    qty: z.number().int().min(1)
  })
});

export const updateInventoryItemSchema = z.object({
  body: z.object({
    type: z.enum(['POT', 'TOOL', 'FERTILIZER']).optional(),
    name: z.string().min(2).max(100).optional(),
    qty: z.number().int().min(0).optional()
  })
});
