import { Request, Response } from "express";
import MyPlant from "../models/my_plant_model";

// @desc    Get all plants of the user
// @route   GET /api/my-plants
// @access  Private
export const getMyPlants = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const plants = await MyPlant.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: plants.length,
      plants: plants.map(p => ({
        id: p._id,
        name: p.name,
        species: p.species,
        imageUrl: p.imageUrl,
        location: p.location,
        waterFrequencyDays: p.waterFrequencyDays,
        lastWatered: p.lastWatered,
        healthStatus: p.healthStatus,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch plants", error });
  }
};

// @desc    Add a new plant
// @route   POST /api/my-plants
// @access  Private
export const addPlant = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, species, imageUrl, location, waterFrequencyDays, lastWatered, healthStatus } = req.body;

    if (!name || !species || !location || waterFrequencyDays === undefined) {
      return res.status(400).json({ message: "Name, species, location and water frequency are required" });
    }

    const plant = await MyPlant.create({
      user: userId,
      name: name.trim(),
      species: species.trim(),
      imageUrl: imageUrl || "",
      location,
      waterFrequencyDays: Number(waterFrequencyDays),
      lastWatered: lastWatered ? new Date(lastWatered) : undefined,
      healthStatus: healthStatus || "excellent",
    });

    res.status(201).json({
      success: true,
      plant: {
        id: plant._id,
        name: plant.name,
        species: plant.species,
        imageUrl: plant.imageUrl,
        location: plant.location,
        waterFrequencyDays: plant.waterFrequencyDays,
        lastWatered: plant.lastWatered,
        healthStatus: plant.healthStatus,
        createdAt: plant.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to add plant", error });
  }
};

// @desc    Update a plant
// @route   PUT /api/my-plants/:id
// @access  Private
export const updatePlant = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { name, species, imageUrl, location, waterFrequencyDays, lastWatered, healthStatus } = req.body;

    const plant = await MyPlant.findOne({ _id: req.params.id, user: userId });
    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }

    if (name !== undefined) plant.name = name.trim();
    if (species !== undefined) plant.species = species.trim();
    if (imageUrl !== undefined) plant.imageUrl = imageUrl;
    if (location !== undefined) plant.location = location;
    if (waterFrequencyDays !== undefined) plant.waterFrequencyDays = Number(waterFrequencyDays);
    if (lastWatered !== undefined) plant.lastWatered = new Date(lastWatered);
    if (healthStatus !== undefined) plant.healthStatus = healthStatus;

    await plant.save();

    res.status(200).json({
      success: true,
      plant: {
        id: plant._id,
        name: plant.name,
        species: plant.species,
        imageUrl: plant.imageUrl,
        location: plant.location,
        waterFrequencyDays: plant.waterFrequencyDays,
        lastWatered: plant.lastWatered,
        healthStatus: plant.healthStatus,
        createdAt: plant.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update plant", error });
  }
};

// @desc    Delete a plant
// @route   DELETE /api/my-plants/:id
// @access  Private
export const deletePlant = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const plant = await MyPlant.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!plant) {
      return res.status(404).json({ message: "Plant not found or unauthorized" });
    }

    res.status(200).json({
      success: true,
      message: "Plant deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete plant", error });
  }
};

// @desc    Log plant watering
// @route   POST /api/my-plants/:id/water
// @access  Private
export const waterPlant = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { wateredAt } = req.body;

    const plant = await MyPlant.findOne({ _id: req.params.id, user: userId });
    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }

    plant.lastWatered = wateredAt ? new Date(wateredAt) : new Date();
    await plant.save();

    res.status(200).json({
      success: true,
      message: "Watering logged successfully",
      lastWatered: plant.lastWatered,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to log watering", error });
  }
};
