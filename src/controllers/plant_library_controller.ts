import { Request, Response } from "express";
import Plant from "../models/plant_model";
import Disease from "../models/disease_model";

// ==========================================
// Plants Controllers
// ==========================================

// @desc    Get all plants
// @route   GET /api/plant-library/plants
// @access  Public
export const getPlants = async (req: Request, res: Response) => {
  try {
    const plants = await Plant.find().sort({ nameEn: 1 });
    res.status(200).json({ success: true, data: plants });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch plants" });
  }
};

// @desc    Add new plant
// @route   POST /api/plant-library/plants
// @access  Admin
export const addPlant = async (req: Request, res: Response) => {
  try {
    const { nameAr, nameEn, scientificName, imageUrl, category, careLevel, descriptionAr, descriptionEn } = req.body;

    if (!nameAr || !nameEn) {
      return res.status(400).json({ success: false, message: "nameAr and nameEn are required fields" });
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
    const { id } = req.params;
    const { nameAr, nameEn, scientificName, imageUrl, category, careLevel, descriptionAr, descriptionEn } = req.body;

    const plant = await Plant.findById(id);
    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    if (nameAr !== undefined) plant.nameAr = nameAr;
    if (nameEn !== undefined) plant.nameEn = nameEn;
    if (scientificName !== undefined) plant.scientificName = scientificName;
    if (imageUrl !== undefined) plant.imageUrl = imageUrl;
    if (category !== undefined) plant.category = category;
    if (careLevel !== undefined) plant.careLevel = careLevel;
    if (descriptionAr !== undefined) plant.descriptionAr = descriptionAr;
    if (descriptionEn !== undefined) plant.descriptionEn = descriptionEn;

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

// ==========================================
// Diseases Controllers
// ==========================================

// @desc    Get all diseases
// @route   GET /api/plant-library/diseases
// @access  Public
export const getDiseases = async (req: Request, res: Response) => {
  try {
    const diseases = await Disease.find().sort({ nameEn: 1 });
    res.status(200).json({ success: true, data: diseases });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch diseases" });
  }
};

// @desc    Add new disease
// @route   POST /api/plant-library/diseases
// @access  Admin
export const addDisease = async (req: Request, res: Response) => {
  try {
    const { nameAr, nameEn, imageUrl, severity, type, affectedPlantsCount, descriptionAr, descriptionEn } = req.body;

    if (!nameAr || !nameEn) {
      return res.status(400).json({ success: false, message: "nameAr and nameEn are required fields" });
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
    const { nameAr, nameEn, imageUrl, severity, type, affectedPlantsCount, descriptionAr, descriptionEn } = req.body;

    const disease = await Disease.findById(id);
    if (!disease) {
      return res.status(404).json({ success: false, message: "Disease not found" });
    }

    if (nameAr !== undefined) disease.nameAr = nameAr;
    if (nameEn !== undefined) disease.nameEn = nameEn;
    if (imageUrl !== undefined) disease.imageUrl = imageUrl;
    if (severity !== undefined) disease.severity = severity;
    if (type !== undefined) disease.type = type;
    if (affectedPlantsCount !== undefined) disease.affectedPlantsCount = affectedPlantsCount;
    if (descriptionAr !== undefined) disease.descriptionAr = descriptionAr;
    if (descriptionEn !== undefined) disease.descriptionEn = descriptionEn;

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
