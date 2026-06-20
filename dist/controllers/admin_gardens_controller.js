"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminGardenById = exports.getAdminGardens = void 0;
const garden_model_1 = __importDefault(require("../models/garden_model"));
const my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
const api_response_1 = require("../utils/api_response");
const app_error_1 = require("../utils/app_error");
// @desc    Admin: Get all gardens globally
// @route   GET /api/admin/gardens
// @access  Private/Admin
const getAdminGardens = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const { search, type, user } = req.query;
        const query = {};
        if (search) {
            query.name = { $regex: search, $options: "i" };
        }
        if (type)
            query.type = type;
        if (user)
            query.user = user;
        const total = await garden_model_1.default.countDocuments(query);
        const gardens = await garden_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate('user', 'firstName lastName email');
        // For each garden, count how many plants are associated with it
        const gardensWithPlantCount = await Promise.all(gardens.map(async (g) => {
            const plantCount = await my_plant_model_1.default.countDocuments({ garden: g._id });
            return {
                id: g._id,
                name: g.name,
                type: g.type,
                score: g.score,
                createdAt: g.createdAt,
                plantCount,
                user: g.user ? { id: g.user._id, name: `${g.user.firstName || ''} ${g.user.lastName || ''}`.trim() || 'Unknown', email: g.user.email } : null
            };
        }));
        return (0, api_response_1.ok)(res, {
            total,
            page,
            totalPages: Math.ceil(total / limit),
            gardens: gardensWithPlantCount
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminGardens = getAdminGardens;
// @desc    Admin: Get detailed garden by ID
// @route   GET /api/admin/gardens/:id
// @access  Private/Admin
const getAdminGardenById = async (req, res, next) => {
    try {
        const garden = await garden_model_1.default.findById(req.params.id)
            .populate('user', 'firstName lastName email');
        if (!garden) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Garden not found' });
        }
        // Fetch all plants inside this garden
        const plants = await my_plant_model_1.default.find({ garden: garden._id });
        const userObj = garden.user;
        return (0, api_response_1.ok)(res, {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminGardenById = getAdminGardenById;
