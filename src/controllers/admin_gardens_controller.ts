import { Request, Response, NextFunction } from "express";
import Garden from "../models/garden_model";
import MyPlant from "../models/my_plant_model";
import { ok } from "../utils/api_response";
import { AppError } from "../utils/app_error";

// @desc    Admin: Get all gardens globally
// @route   GET /api/admin/gardens
// @access  Private/Admin
export const getAdminGardens = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const { search, type, user } = req.query;

    const query: any = {};

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }
    if (type) query.type = type;
    if (user) query.user = user;

    const total = await Garden.countDocuments(query);
    const gardens = await Garden.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'firstName lastName email');

    // For each garden, count how many plants are associated with it
    const gardensWithPlantCount = await Promise.all(
      gardens.map(async (g: any) => {
        const plantCount = await MyPlant.countDocuments({ garden: g._id });
        return {
          id: g._id,
          name: g.name,
          type: g.type,
          score: g.score,
          createdAt: g.createdAt,
          plantCount,
          user: g.user ? { id: g.user._id, name: `${g.user.firstName || ''} ${g.user.lastName || ''}`.trim() || 'Unknown', email: g.user.email } : null
        };
      })
    );

    return ok(res, {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      gardens: gardensWithPlantCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get detailed garden by ID
// @route   GET /api/admin/gardens/:id
// @access  Private/Admin
export const getAdminGardenById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const garden = await Garden.findById(req.params.id)
      .populate('user', 'firstName lastName email');

    if (!garden) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Garden not found' });
    }

    // Fetch all plants inside this garden
    const plants = await MyPlant.find({ garden: garden._id });

    const userObj = garden.user as any;

    return ok(res, {
      garden: {
        id: garden._id,
        name: garden.name,
        type: garden.type,
        score: garden.score,
        createdAt: garden.createdAt,
        user: garden.user ? { id: userObj._id, name: `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || 'Unknown', email: userObj.email } : null
      },
      plants: plants.map(p => ({
        id: p._id,
        name: p.name,
        species: p.species,
        imageUrl: p.imageUrl,
        location: p.location,
        healthStatus: p.healthStatus,
        growthStage: p.growthStage || 'MATURE'
      }))
    });
  } catch (error) {
    next(error);
  }
};


