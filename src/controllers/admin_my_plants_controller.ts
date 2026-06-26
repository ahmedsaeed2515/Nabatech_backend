import { Request, Response, NextFunction } from "express";
import MyPlant from "../models/my_plant_model";
import { ok } from "../utils/api_response";
import WateringLog from "../models/watering_log_model";
import DiaryEntry from "../models/diary_entry_model";
import Reminder from "../models/reminder_model";
import DiagnosisHistory from "../models/diagnosis_history_model";
import { deleteCloudinaryImage } from "./my_plants_controller";
// @desc    Admin: Get all plants globally
// @route   GET /api/admin/my-plants
// @access  Private/Admin
export const getAdminPlants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const { search, healthStatus, sort } = req.query;

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { species: { $regex: search, $options: "i" } }
      ];
    }
    if (healthStatus) query.healthStatus = healthStatus;

    let sortOption: any = { createdAt: -1 };
    if (sort === "name_asc") sortOption = { name: 1 };
    if (sort === "name_desc") sortOption = { name: -1 };

    const total = await MyPlant.countDocuments(query);
    const plants = await MyPlant.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email');

    return ok(res, {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      plants: plants.map((p: any) => ({
        id: p._id,
        name: p.name,
        species: p.species,
        imageUrl: p.imageUrl,
        location: p.location,
        healthStatus: p.healthStatus,
        createdAt: p.createdAt,
        user: p.user ? { id: p.user._id, name: p.user.name, email: p.user.email } : null,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete a plant
// @route   DELETE /api/admin/my-plants/:id
// @access  Private/Admin
export const deleteAdminPlant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const plant = await MyPlant.findByIdAndDelete(req.params.id);
    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    if (plant.imageUrl) {
      await deleteCloudinaryImage(plant.imageUrl);
    }
    
    await Promise.all([
      WateringLog.deleteMany({ plant: plant._id }),
      DiaryEntry.deleteMany({ plantId: plant._id }),
      Reminder.deleteMany({ plantId: plant._id }),
      DiagnosisHistory.deleteMany({ plantId: plant._id }),
    ]);

    return ok(res, { message: "Plant deleted successfully by admin" });
  } catch (error) {
    next(error);
  }
};


