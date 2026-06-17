"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkImport = exports.deleteDisease = exports.updateDisease = exports.addDisease = exports.getDiseases = exports.deletePlant = exports.updatePlant = exports.addPlant = exports.getPlants = void 0;
const plant_model_1 = __importDefault(require("../models/plant_model"));
const disease_model_1 = __importDefault(require("../models/disease_model"));
const logger_1 = __importDefault(require("../logger"));
// ==========================================
// Plants Controllers
// ==========================================
// @desc    Get all plants
// @route   GET /api/plant-library/plants
// @access  Public
const getPlants = async (req, res) => {
    try {
        logger_1.default.info({ event: "plant_library.getPlants", query: req.query });
        // Pagination: clamp limit to max 100, support cursor-based pagination
        const { search, category, cursor, limit = "20" } = req.query;
        const limitNumber = Math.min(parseInt(limit, 10) || 20, 100);
        // Build query with normalized search if provided
        const query = {};
        if (search) {
            const normalized = search.toLowerCase().trim();
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
        let cursorQuery = {};
        if (cursor) {
            cursorQuery._id = { $gt: cursor };
        }
        const plants = await plant_model_1.default.find({ ...query, ...cursorQuery })
            .sort({ _id: 1 })
            .limit(limitNumber + 1); // fetch one extra to determine hasNextPage
        const hasNextPage = plants.length > limitNumber;
        const items = hasNextPage ? plants.slice(0, -1) : plants;
        const nextCursor = hasNextPage ? items[items.length - 1]._id : null;
        // Legacy pagination metadata for backward compatibility
        const totalCount = await plant_model_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: { items, pageInfo: { hasNextPage, nextCursor } },
            count: totalCount,
            totalPages: Math.ceil(totalCount / limitNumber),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to fetch plants" });
    }
};
exports.getPlants = getPlants;
// @desc    Add new plant
// @route   POST /api/plant-library/plants
// @access  Admin
const addPlant = async (req, res) => {
    try {
        logger_1.default.info({ event: "plant_library.addPlant", body: req.body, user: req.user?.id });
        const { nameAr, nameEn, scientificName, imageUrl, category, careLevel, descriptionAr, descriptionEn, waterRequirements, lightRequirements, humidityRequirements, soilRequirements, fertilizerRequirements, growthRate, matureSize, temperatureRange, toxicityLevel, wateringFrequency, careInstructions, commonProblems, propagationMethod, nativeRegion, plantBenefits } = req.body;
        if (!nameAr || !nameEn) {
            return res.status(400).json({ success: false, message: "nameAr and nameEn are required fields" });
        }
        const slug = nameEn.toLowerCase().replace(/\s+/g, '-');
        const existing = await plant_model_1.default.findOne({ slug });
        if (existing) {
            return res.status(409).json({ success: false, message: "Plant with this slug already exists" });
        }
        const plant = await plant_model_1.default.create({
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
            createdBy: req.user?.id || '',
        });
        res.status(201).json({ success: true, data: plant });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to create plant" });
    }
};
exports.addPlant = addPlant;
// @desc    Update plant details
// @route   PUT /api/plant-library/plants/:id
// @access  Admin
const updatePlant = async (req, res) => {
    try {
        logger_1.default.info({ event: "plant_library.updatePlant", params: req.params, body: req.body, user: req.user?.id });
        const { id } = req.params;
        const { nameAr, nameEn, scientificName, imageUrl, category, careLevel, descriptionAr, descriptionEn, waterRequirements, lightRequirements, humidityRequirements, soilRequirements, fertilizerRequirements, growthRate, matureSize, temperatureRange, toxicityLevel, wateringFrequency, careInstructions, commonProblems, propagationMethod, nativeRegion, plantBenefits } = req.body;
        const plant = await plant_model_1.default.findById(id);
        if (!plant) {
            return res.status(404).json({ success: false, message: "Plant not found" });
        }
        if (nameAr !== undefined)
            plant.nameAr = nameAr;
        if (nameEn !== undefined)
            plant.nameEn = nameEn;
        if (scientificName !== undefined)
            plant.scientificName = scientificName;
        if (imageUrl !== undefined)
            plant.imageUrl = imageUrl;
        if (category !== undefined)
            plant.category = category;
        if (careLevel !== undefined)
            plant.careLevel = careLevel;
        if (descriptionAr !== undefined)
            plant.descriptionAr = descriptionAr;
        if (descriptionEn !== undefined)
            plant.descriptionEn = descriptionEn;
        if (waterRequirements !== undefined)
            plant.waterRequirements = waterRequirements;
        if (lightRequirements !== undefined)
            plant.lightRequirements = lightRequirements;
        if (humidityRequirements !== undefined)
            plant.humidityRequirements = humidityRequirements;
        if (soilRequirements !== undefined)
            plant.soilRequirements = soilRequirements;
        if (fertilizerRequirements !== undefined)
            plant.fertilizerRequirements = fertilizerRequirements;
        if (growthRate !== undefined)
            plant.growthRate = growthRate;
        if (matureSize !== undefined)
            plant.matureSize = matureSize;
        if (temperatureRange !== undefined)
            plant.temperatureRange = temperatureRange;
        if (toxicityLevel !== undefined)
            plant.toxicityLevel = toxicityLevel;
        if (wateringFrequency !== undefined)
            plant.wateringFrequency = wateringFrequency;
        if (careInstructions !== undefined)
            plant.careInstructions = careInstructions;
        if (commonProblems !== undefined)
            plant.commonProblems = commonProblems;
        if (propagationMethod !== undefined)
            plant.propagationMethod = propagationMethod;
        if (nativeRegion !== undefined)
            plant.nativeRegion = nativeRegion;
        if (plantBenefits !== undefined)
            plant.plantBenefits = plantBenefits;
        await plant.save();
        res.status(200).json({ success: true, data: plant });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to update plant" });
    }
};
exports.updatePlant = updatePlant;
// @desc    Delete plant
// @route   DELETE /api/plant-library/plants/:id
// @access  Admin
const deletePlant = async (req, res) => {
    try {
        logger_1.default.info({ event: "plant_library.deletePlant", params: req.params, user: req.user?.id });
        const { id } = req.params;
        const plant = await plant_model_1.default.findByIdAndDelete(id);
        if (!plant) {
            return res.status(404).json({ success: false, message: "Plant not found" });
        }
        res.status(200).json({ success: true, message: "Plant deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to delete plant" });
    }
};
exports.deletePlant = deletePlant;
// ==========================================
// Diseases Controllers
// ==========================================
// @desc    Get all diseases
// @route   GET /api/plant-library/diseases
// @access  Public
const getDiseases = async (req, res) => {
    try {
        logger_1.default.info({ event: "plant_library.getDiseases", query: req.query });
        // Pagination: clamp limit to max 100, support cursor pagination
        const { search, type, cursor, limit = "20" } = req.query;
        const limitNumber = Math.min(parseInt(limit, 10) || 20, 100);
        // Build query with normalized search
        const query = {};
        if (search) {
            const normalized = search.toLowerCase().trim();
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
        let cursorQuery = {};
        if (cursor) {
            cursorQuery._id = { $gt: cursor };
        }
        const diseases = await disease_model_1.default.find({ ...query, ...cursorQuery })
            .sort({ _id: 1 })
            .limit(limitNumber + 1);
        const hasNextPage = diseases.length > limitNumber;
        const items = hasNextPage ? diseases.slice(0, -1) : diseases;
        const nextCursor = hasNextPage ? items[items.length - 1]._id : null;
        // Legacy count for compatibility
        const totalCount = await disease_model_1.default.countDocuments(query);
        res.status(200).json({
            success: true,
            data: { items, pageInfo: { hasNextPage, nextCursor } },
            count: totalCount,
            totalPages: Math.ceil(totalCount / limitNumber),
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to fetch diseases" });
    }
};
exports.getDiseases = getDiseases;
// @desc    Add new disease
// @route   POST /api/plant-library/diseases
// @access  Admin
const addDisease = async (req, res) => {
    try {
        logger_1.default.info({ event: "plant_library.addDisease", body: req.body, user: req.user?.id });
        const { nameAr, nameEn, imageUrl, severity, type, affectedPlantsCount, descriptionAr, descriptionEn } = req.body;
        if (!nameAr || !nameEn) {
            return res.status(400).json({ success: false, message: "nameAr and nameEn are required fields" });
        }
        const disease = await disease_model_1.default.create({
            nameAr,
            nameEn,
            imageUrl,
            severity,
            type,
            affectedPlantsCount,
            descriptionAr,
            descriptionEn,
        });
        res.status(201).json({ success: true, data: disease });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to create disease" });
    }
};
exports.addDisease = addDisease;
// @desc    Update disease details
// @route   PUT /api/plant-library/diseases/:id
// @access  Admin
const updateDisease = async (req, res) => {
    try {
        const { id } = req.params;
        const { nameAr, nameEn, imageUrl, severity, type, affectedPlantsCount, descriptionAr, descriptionEn } = req.body;
        const disease = await disease_model_1.default.findById(id);
        if (!disease) {
            return res.status(404).json({ success: false, message: "Disease not found" });
        }
        if (nameAr !== undefined)
            disease.nameAr = nameAr;
        if (nameEn !== undefined)
            disease.nameEn = nameEn;
        if (imageUrl !== undefined)
            disease.imageUrl = imageUrl;
        if (severity !== undefined)
            disease.severity = severity;
        if (type !== undefined)
            disease.type = type;
        if (affectedPlantsCount !== undefined)
            disease.affectedPlantsCount = affectedPlantsCount;
        if (descriptionAr !== undefined)
            disease.descriptionAr = descriptionAr;
        if (descriptionEn !== undefined)
            disease.descriptionEn = descriptionEn;
        await disease.save();
        res.status(200).json({ success: true, data: disease });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to update disease" });
    }
};
exports.updateDisease = updateDisease;
// @desc    Delete disease
// @route   DELETE /api/plant-library/diseases/:id
// @access  Admin
const deleteDisease = async (req, res) => {
    try {
        const { id } = req.params;
        const disease = await disease_model_1.default.findByIdAndDelete(id);
        if (!disease) {
            return res.status(404).json({ success: false, message: "Disease not found" });
        }
        res.status(200).json({ success: true, message: "Disease deleted successfully" });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || "Failed to delete disease" });
    }
};
exports.deleteDisease = deleteDisease;
const bulkImport = async (req, res) => {
    try {
        const { kind, rows } = req.body;
        const idempotencyKey = req.header('Idempotency-Key');
        if (!idempotencyKey) {
            return res.status(400).json({ success: false, message: 'Idempotency-Key header required' });
        }
        // Simple in-memory idempotency placeholder (replace with persistent store)
        const existing = global.__importIdempotency?.[idempotencyKey];
        if (existing) {
            return res.status(200).json(existing);
        }
        const accepted = [];
        const rejected = [];
        const created = [];
        const updated = [];
        const errors = [];
        for (let i = 0; i < rows.length; i++) {
            const row = rows[i];
            try {
                if (kind === 'plants') {
                    // Validate row
                    const { PlantImportRowSchema } = await Promise.resolve().then(() => __importStar(require('../validation/plant_library_schemas')));
                    PlantImportRowSchema.parse(row);
                    const slug = row.slug || row.nameEn.toLowerCase().replace(/\s+/g, '-');
                    const normalizedNameEn = row.nameEn.toLowerCase();
                    const normalizedNameAr = row.nameAr.toLowerCase();
                    const existingDoc = await plant_model_1.default.findOne({ slug });
                    if (existingDoc) {
                        Object.assign(existingDoc, { ...row, slug, normalizedNameEn, normalizedNameAr, updatedBy: req.user?.id || '' });
                        await existingDoc.save();
                        updated.push(existingDoc);
                    }
                    else {
                        const createdDoc = await plant_model_1.default.create({ ...row, slug, normalizedNameEn, normalizedNameAr, createdBy: req.user?.id || '' });
                        created.push(createdDoc);
                    }
                    accepted.push(row);
                }
                else if (kind === 'diseases') {
                    const { DiseaseImportRowSchema } = await Promise.resolve().then(() => __importStar(require('../validation/plant_library_schemas')));
                    DiseaseImportRowSchema.parse(row);
                    const slug = row.slug || row.nameEn.toLowerCase().replace(/\s+/g, '-');
                    const normalizedNameEn = row.nameEn.toLowerCase();
                    const normalizedNameAr = row.nameAr.toLowerCase();
                    const existingDoc = await disease_model_1.default.findOne({ slug });
                    if (existingDoc) {
                        Object.assign(existingDoc, { ...row, slug, normalizedNameEn, normalizedNameAr, updatedBy: req.user?.id || '' });
                        await existingDoc.save();
                        updated.push(existingDoc);
                    }
                    else {
                        const createdDoc = await disease_model_1.default.create({ ...row, slug, normalizedNameEn, normalizedNameAr, createdBy: req.user?.id || '' });
                        created.push(createdDoc);
                    }
                    accepted.push(row);
                }
                else {
                    throw new Error('Invalid kind');
                }
            }
            catch (rowErr) {
                rejected.push(row);
                errors.push({ row, error: rowErr.message });
            }
        }
        const response = { success: true, data: { accepted, rejected, created, updated, errors } };
        global.__importIdempotency = global.__importIdempotency || {};
        global.__importIdempotency[idempotencyKey] = response;
        res.status(200).json(response);
    }
    catch (err) {
        res.status(500).json({ success: false, message: err.message || 'Bulk import failed' });
    }
};
exports.bulkImport = bulkImport;
