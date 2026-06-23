import { Request, Response } from "express";
import Plant from "../models/plant_model";
import Disease from "../models/disease_model";
import logger from "../logger";
// ==========================================
// Plants Controllers
// ==========================================

// @desc    Get all plants
// @route   GET /api/plant-library/plants
// @access  Public
export const getPlants = async (req: Request, res: Response) => {
  try {
    logger.info({ event: "plant_library.getPlants", query: req.query });
    // Pagination: clamp limit to max 100, support cursor-based pagination
  const { search, category, cursor, limit = "20" } = req.query;
  const limitNumber = Math.min(parseInt(limit as string, 10) || 20, 100);

  // Build query with normalized search if provided
  const query: any = { isLibraryItem: true };
  if (search) {
    const normalized = (search as string).toLowerCase().trim();
    // Prefix search on normalized fields, fallback to regex on original fields
    query.$or = [
      { normalizedNameEn: { $regex: `^${normalized}` } },
      { normalizedNameAr: { $regex: `^${normalized}` } },
      { nameEn: { $regex: search, $options: "i" } },
      { nameAr: { $regex: search, $options: "i" } },
    ];
  }
  if (category) {
    query.category = category;
  }

  // Cursor pagination using ObjectId as opaque cursor
  let cursorQuery = {} as any;
  if (cursor) {
    cursorQuery._id = { $gt: cursor };
  }
  const plants = await Plant.find({ ...query, ...cursorQuery })
    .sort({ _id: 1 })
    .limit(limitNumber + 1); // fetch one extra to determine hasNextPage

  const hasNextPage = plants.length > limitNumber;
  const items = hasNextPage ? plants.slice(0, -1) : plants;
  const nextCursor = hasNextPage ? items[items.length - 1]._id : null;

  // Legacy pagination metadata for backward compatibility
  const totalCount = await Plant.countDocuments(query);

  res.status(200).json({
    success: true,
    data: { items, pageInfo: { hasNextPage, nextCursor } },
    count: totalCount,
    totalPages: Math.ceil(totalCount / limitNumber),
  });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch plants" });
  }
};

// @desc    Search plants by wildcard text
// @route   GET /api/v1/admin/plants/search
// @access  Admin
export const adminSearchPlants = async (req: Request, res: Response) => {
  try {
    const { q, cursor, limit = "20" } = req.query;
    const limitNumber = Math.min(parseInt(limit as string, 10) || 20, 100);

    const query: any = { isLibraryItem: true };
    if (q) {
      const search = (q as string).trim();
      query.$or = [
        { species: { $regex: search, $options: "i" } },
        { scientificName: { $regex: search, $options: "i" } },
        { descriptionEn: { $regex: search, $options: "i" } },
        { nameEn: { $regex: search, $options: "i" } },
        { nameAr: { $regex: search, $options: "i" } }
      ];
    }

    let cursorQuery = {} as any;
    if (cursor) {
      cursorQuery._id = { $gt: cursor };
    }

    const plants = await Plant.find({ ...query, ...cursorQuery })
      .sort({ _id: 1 })
      .limit(limitNumber + 1);

    const hasNextPage = plants.length > limitNumber;
    const items = hasNextPage ? plants.slice(0, -1) : plants;
    const nextCursor = hasNextPage ? items[items.length - 1]._id : null;
    const totalCount = await Plant.countDocuments(query);

    res.status(200).json({
      success: true,
      data: { items, pageInfo: { hasNextPage, nextCursor } },
      count: totalCount,
      totalPages: Math.ceil(totalCount / limitNumber),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to search plants" });
  }
};

// @desc    Add new plant
// @route   POST /api/plant-library/plants
// @access  Admin
export const addPlant = async (req: Request, res: Response) => {
  try {
    logger.info({ event: "plant_library.addPlant", body: req.body, user: (req as any).user?.id });
    const { nameAr, nameEn, scientificName, imageUrl, category, careLevel, descriptionAr, descriptionEn, waterRequirements, lightRequirements, humidityRequirements, soilRequirements, fertilizerRequirements, growthRate, matureSize, temperatureRange, toxicityLevel, wateringFrequency, careInstructions, commonProblems, propagationMethod, nativeRegion, plantBenefits } = req.body;

    if (!nameAr || !nameEn) {
      return res.status(400).json({ success: false, message: "nameAr and nameEn are required fields" });
    }

    const slug = nameEn.toLowerCase().replace(/\s+/g, '-');
    const existing = await Plant.findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: "Plant with this slug already exists" });
    }

    const plant = await Plant.create({
      nameAr,
      nameEn,
      scientificName,
      imageUrl,
      category,
      careLevel,
      descriptionAr,
      descriptionEn,
      waterRequirements,
      lightRequirements,
      humidityRequirements,
      soilRequirements,
      fertilizerRequirements,
      growthRate,
      matureSize,
      temperatureRange,
      toxicityLevel,
      wateringFrequency,
      careInstructions,
      commonProblems,
      propagationMethod,
      nativeRegion,
      plantBenefits,
      slug,
      normalizedNameEn: nameEn.toLowerCase(),
      normalizedNameAr: nameAr.toLowerCase(),
      active: true,
      createdBy: (req as any).user?.id || '',
      isLibraryItem: true,
    });

    res.status(201).json({ success: true, data: plant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create plant" });
  }
};

// @desc    Update plant details
// @route   PUT /api/plant-library/plants/:id
// @access  Admin
export const updatePlant = async (req: Request, res: Response) => {
  try {
    logger.info({ event: "plant_library.updatePlant", params: req.params, body: req.body, user: (req as any).user?.id });
    const { id } = req.params;
    const { nameAr, nameEn, scientificName, imageUrl, category, careLevel, descriptionAr, descriptionEn, waterRequirements, lightRequirements, humidityRequirements, soilRequirements, fertilizerRequirements, growthRate, matureSize, temperatureRange, toxicityLevel, wateringFrequency, careInstructions, commonProblems, propagationMethod, nativeRegion, plantBenefits, status } = req.body;

    const plant = await Plant.findById(id);
    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    if (nameAr !== undefined) {
      plant.nameAr = nameAr;
      plant.normalizedNameAr = nameAr.replace(/[\u0600-\u06ff]/g, '');
    }
    if (nameEn !== undefined) {
      plant.nameEn = nameEn;
      plant.slug = nameEn.toLowerCase().replace(/\s+/g, '-');
      plant.normalizedNameEn = nameEn.toLowerCase();
    }
    if (scientificName !== undefined) plant.scientificName = scientificName;
    if (imageUrl !== undefined) plant.imageUrl = imageUrl;
    if (category !== undefined) plant.category = category;
    if (careLevel !== undefined) plant.careLevel = careLevel;
    if (descriptionAr !== undefined) plant.descriptionAr = descriptionAr;
    if (descriptionEn !== undefined) plant.descriptionEn = descriptionEn;
    if (waterRequirements !== undefined) plant.waterRequirements = waterRequirements;
    if (lightRequirements !== undefined) plant.lightRequirements = lightRequirements;
    if (humidityRequirements !== undefined) plant.humidityRequirements = humidityRequirements;
    if (soilRequirements !== undefined) plant.soilRequirements = soilRequirements;
    if (fertilizerRequirements !== undefined) plant.fertilizerRequirements = fertilizerRequirements;
    if (growthRate !== undefined) plant.growthRate = growthRate;
    if (matureSize !== undefined) plant.matureSize = matureSize;
    if (temperatureRange !== undefined) plant.temperatureRange = temperatureRange;
    if (toxicityLevel !== undefined) plant.toxicityLevel = toxicityLevel;
    if (wateringFrequency !== undefined) plant.wateringFrequency = wateringFrequency;
    if (careInstructions !== undefined) plant.careInstructions = careInstructions;
    if (commonProblems !== undefined) plant.commonProblems = commonProblems;
    if (propagationMethod !== undefined) plant.propagationMethod = propagationMethod;
    if (nativeRegion !== undefined) plant.nativeRegion = nativeRegion;
    if (plantBenefits !== undefined) plant.plantBenefits = plantBenefits;
    if (status !== undefined) plant.status = status;

    await plant.save();

    res.status(200).json({ success: true, data: plant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update plant" });
  }
};

// @desc    Delete plant
// @route   DELETE /api/plant-library/plants/:id
// @access  Admin
export const deletePlant = async (req: Request, res: Response) => {
  try {
    logger.info({ event: "plant_library.deletePlant", params: req.params, user: (req as any).user?.id });
    const { id } = req.params;

    const plant = await Plant.findByIdAndDelete(id);
    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    res.status(200).json({ success: true, message: "Plant deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete plant" });
  }
};

// @desc    Get plant by id
// @route   GET /api/plant-library/plants/:id
// @access  Public
export const getPlantById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plant = await Plant.findById(id).populate('tags diseases seasons');
    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }
    res.status(200).json({ success: true, data: plant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch plant" });
  }
};

// @desc    Archive plant
// @route   PATCH /api/plant-library/plants/:id/archive
// @access  Admin
export const archivePlant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plant = await Plant.findByIdAndUpdate(id, { status: 'ARCHIVED' }, { new: true });
    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }
    res.status(200).json({ success: true, data: plant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to archive plant" });
  }
};

// @desc    Publish plant
// @route   PATCH /api/plant-library/plants/:id/publish
// @access  Admin
export const publishPlant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const plant = await Plant.findByIdAndUpdate(id, { status: 'PUBLISHED' }, { new: true });
    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }
    res.status(200).json({ success: true, data: plant });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to publish plant" });
  }
};

// @desc    Search plants (dedicated search endpoint)
// @route   GET /api/plant-library/plants/search
// @access  Public
export const searchPlants = async (req: Request, res: Response) => {
  try {
    const { q, limit = "10" } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, message: "Search query 'q' is required" });
    }
    const limitNumber = Math.min(parseInt(limit as string, 10) || 10, 50);
    const normalized = (q as string).toLowerCase().trim();
    
    const query = {
      isLibraryItem: true,
      status: 'PUBLISHED',
      $or: [
        { normalizedNameEn: { $regex: `^${normalized}` } },
        { normalizedNameAr: { $regex: `^${normalized}` } },
        { nameEn: { $regex: q, $options: "i" } },
        { nameAr: { $regex: q, $options: "i" } },
      ]
    };
    
    const plants = await Plant.find(query).limit(limitNumber).select('nameAr nameEn imageUrl category slug');
    res.status(200).json({ success: true, data: plants });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to search plants" });
  }
};

// @desc    Get plant stats
// @route   GET /api/plant-library/plants/stats
// @access  Admin
export const getPlantStats = async (req: Request, res: Response) => {
  try {
    const totalCount = await Plant.countDocuments({ isLibraryItem: true });
    const publishedCount = await Plant.countDocuments({ isLibraryItem: true, status: 'PUBLISHED' });
    const draftCount = await Plant.countDocuments({ isLibraryItem: true, status: 'DRAFT' });
    const archivedCount = await Plant.countDocuments({ isLibraryItem: true, status: 'ARCHIVED' });
    
    res.status(200).json({
      success: true,
      data: { totalCount, publishedCount, draftCount, archivedCount }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch stats" });
  }
};

// @desc    Export plants
// @route   GET /api/plant-library/plants/export
// @access  Admin
export const exportPlants = async (req: Request, res: Response) => {
  try {
    const plants = await Plant.find({ isLibraryItem: true }).lean();
    res.status(200).json({ success: true, data: plants });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to export plants" });
  }
};

// ==========================================
// Diseases Controllers
// ==========================================

// @desc    Get all diseases
// @route   GET /api/plant-library/diseases
// @access  Public
export const getDiseases = async (req: Request, res: Response) => {
  try {
    logger.info({ event: "plant_library.getDiseases", query: req.query });
    // Pagination: clamp limit to max 100, support cursor pagination
  const { search, type, cursor, limit = "20" } = req.query;
  const limitNumber = Math.min(parseInt(limit as string, 10) || 20, 100);

  // Build query with normalized search
  const query: any = {};
  if (search) {
    const normalized = (search as string).toLowerCase().trim();
    query.$or = [
      { normalizedNameEn: { $regex: `^${normalized}` } },
      { normalizedNameAr: { $regex: `^${normalized}` } },
      { nameEn: { $regex: search, $options: "i" } },
      { nameAr: { $regex: search, $options: "i" } },
    ];
  }
  if (type) {
    query.type = type;
  }

  // Cursor pagination
  let cursorQuery = {} as any;
  if (cursor) {
    cursorQuery._id = { $gt: cursor };
  }
  const diseases = await Disease.find({ ...query, ...cursorQuery })
    .sort({ _id: 1 })
    .limit(limitNumber + 1);

  const hasNextPage = diseases.length > limitNumber;
  const items = hasNextPage ? diseases.slice(0, -1) : diseases;
  const nextCursor = hasNextPage ? items[items.length - 1]._id : null;

  // Legacy count for compatibility
  const totalCount = await Disease.countDocuments(query);

  res.status(200).json({
    success: true,
    data: { items, pageInfo: { hasNextPage, nextCursor } },
    count: totalCount,
    totalPages: Math.ceil(totalCount / limitNumber),
  });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch diseases" });
  }
};

// @desc    Add new disease
// @route   POST /api/plant-library/diseases
// @access  Admin
export const addDisease = async (req: Request, res: Response) => {
  try {
    logger.info({ event: "plant_library.addDisease", body: req.body, user: (req as any).user?.id });
    const { nameAr, nameEn, imageUrl, severity, type, affectedPlantsCount, descriptionAr, descriptionEn } = req.body;

    if (!nameAr || !nameEn) {
      return res.status(400).json({ success: false, message: "nameAr and nameEn are required fields" });
    }

    const slug = nameEn.toLowerCase().replace(/\s+/g, '-');
    const existing = await Disease.findOne({ slug });
    if (existing) {
      return res.status(409).json({ success: false, message: "Disease with this slug already exists" });
    }

    const disease = await Disease.create({
      nameAr,
      nameEn,
      imageUrl,
      severity,
      type,
      affectedPlantsCount,
      descriptionAr,
      descriptionEn,
      slug,
      normalizedNameEn: nameEn.toLowerCase(),
      normalizedNameAr: nameAr.replace(/[^\u0600-\u06FF]/g, ''),
      active: true,
      createdBy: (req as any).user?.id || '',
    });

    res.status(201).json({ success: true, data: disease });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to create disease" });
  }
};

// @desc    Update disease details
// @route   PUT /api/plant-library/diseases/:id
// @access  Admin
export const updateDisease = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nameAr, nameEn, imageUrl, severity, type, affectedPlantsCount, descriptionAr, descriptionEn, active } = req.body;

    const disease = await Disease.findById(id);
    if (!disease) {
      return res.status(404).json({ success: false, message: "Disease not found" });
    }

    if (nameAr !== undefined) {
      disease.nameAr = nameAr;
      disease.normalizedNameAr = nameAr.replace(/[^\u0600-\u06FF]/g, '');
    }
    if (nameEn !== undefined) {
      disease.nameEn = nameEn;
      disease.slug = nameEn.toLowerCase().replace(/\s+/g, '-');
      disease.normalizedNameEn = nameEn.toLowerCase();
    }
    if (imageUrl !== undefined) disease.imageUrl = imageUrl;
    if (severity !== undefined) disease.severity = severity;
    if (type !== undefined) disease.type = type;
    if (affectedPlantsCount !== undefined) disease.affectedPlantsCount = affectedPlantsCount;
    if (descriptionAr !== undefined) disease.descriptionAr = descriptionAr;
    if (descriptionEn !== undefined) disease.descriptionEn = descriptionEn;
    if (active !== undefined) disease.active = active;

    await disease.save();

    res.status(200).json({ success: true, data: disease });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to update disease" });
  }
};

// @desc    Delete disease
// @route   DELETE /api/plant-library/diseases/:id
// @access  Admin
export const deleteDisease = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const disease = await Disease.findByIdAndDelete(id);
    if (!disease) {
      return res.status(404).json({ success: false, message: "Disease not found" });
    }

    res.status(200).json({ success: true, message: "Disease deleted successfully" });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete disease" });
  }
};
export const bulkImport = async (req: Request, res: Response) => {
  try {
    const { kind, rows } = req.body as any;
    const idempotencyKey = req.header('Idempotency-Key');
    if (!idempotencyKey) {
      return res.status(400).json({ success: false, message: 'Idempotency-Key header required' });
    }
    // Simple in-memory idempotency placeholder (replace with persistent store)
    const existing = (global as any).__importIdempotency?.[idempotencyKey];
    if (existing) {
      return res.status(200).json(existing);
    }

    const accepted: any[] = [];
    const rejected: any[] = [];
    const created: any[] = [];
    const updated: any[] = [];
    const errors: any[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      try {
        if (kind === 'plants') {
          // Validate row
          const { PlantImportRowSchema } = await import('../validation/plant_library_schemas');
          PlantImportRowSchema.parse(row);
          const slug = row.slug || row.nameEn.toLowerCase().replace(/\s+/g, '-');
          const normalizedNameEn = row.nameEn.toLowerCase();
          const normalizedNameAr = row.nameAr.toLowerCase();
          const existingDoc = await Plant.findOne({ slug });
          if (existingDoc) {
            Object.assign(existingDoc, { ...row, slug, normalizedNameEn, normalizedNameAr, updatedBy: (req as any).user?.id || '' });
            await existingDoc.save();
            updated.push(existingDoc);
          } else {
            const createdDoc = await Plant.create({ ...row, slug, normalizedNameEn, normalizedNameAr, createdBy: (req as any).user?.id || '' });
            created.push(createdDoc);
          }
          accepted.push(row);
        } else if (kind === 'diseases') {
          const { DiseaseImportRowSchema } = await import('../validation/plant_library_schemas');
          DiseaseImportRowSchema.parse(row);
          const slug = row.slug || row.nameEn.toLowerCase().replace(/\s+/g, '-');
          const normalizedNameEn = row.nameEn.toLowerCase();
          const normalizedNameAr = row.nameAr.toLowerCase();
          const existingDoc = await Disease.findOne({ slug });
          if (existingDoc) {
            Object.assign(existingDoc, { ...row, slug, normalizedNameEn, normalizedNameAr, updatedBy: (req as any).user?.id || '' });
            await existingDoc.save();
            updated.push(existingDoc);
          } else {
            const createdDoc = await Disease.create({ ...row, slug, normalizedNameEn, normalizedNameAr, createdBy: (req as any).user?.id || '' });
            created.push(createdDoc);
          }
          accepted.push(row);
        } else {
          throw new Error('Invalid kind');
        }
      } catch (rowErr: any) {
        rejected.push(row);
        errors.push({ row, error: rowErr.message });
      }
    }

    const response = { success: true, data: { accepted, rejected, created, updated, errors } };
    (global as any).__importIdempotency = (global as any).__importIdempotency || {};
    (global as any).__importIdempotency[idempotencyKey] = response;
    res.status(200).json(response);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Bulk import failed' });
  }
};
