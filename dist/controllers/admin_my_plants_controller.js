"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAdminPlant = exports.getAdminPlants = void 0;
const my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
const api_response_1 = require("../utils/api_response");
const watering_log_model_1 = __importDefault(require("../models/watering_log_model"));
const diary_entry_model_1 = __importDefault(require("../models/diary_entry_model"));
const reminder_model_1 = __importDefault(require("../models/reminder_model"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const my_plants_controller_1 = require("./my_plants_controller");
// @desc    Admin: Get all plants globally
// @route   GET /api/admin/my-plants
// @access  Private/Admin
const getAdminPlants = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const { search, healthStatus, sort } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { species: { $regex: search, $options: "i" } }
            ];
        }
        if (healthStatus)
            query.healthStatus = healthStatus;
        let sortOption = { createdAt: -1 };
        if (sort === "name_asc")
            sortOption = { name: 1 };
        if (sort === "name_desc")
            sortOption = { name: -1 };
        const total = await my_plant_model_1.default.countDocuments(query);
        const plants = await my_plant_model_1.default.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .populate('user', 'name email');
        return (0, api_response_1.ok)(res, {
            total,
            page,
            totalPages: Math.ceil(total / limit),
            plants: plants.map((p) => ({
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
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminPlants = getAdminPlants;
// @desc    Admin: Delete a plant
// @route   DELETE /api/admin/my-plants/:id
// @access  Private/Admin
const deleteAdminPlant = async (req, res, next) => {
    try {
        const plant = await my_plant_model_1.default.findByIdAndDelete(req.params.id);
        if (!plant) {
            return res.status(404).json({ success: false, message: "Plant not found" });
        }
        if (plant.imageUrl) {
            await (0, my_plants_controller_1.deleteCloudinaryImage)(plant.imageUrl);
        }
        await Promise.all([
            watering_log_model_1.default.deleteMany({ plant: plant._id }),
            diary_entry_model_1.default.deleteMany({ plantId: plant._id }),
            reminder_model_1.default.deleteMany({ plantId: plant._id }),
            diagnosis_history_model_1.default.deleteMany({ plantId: plant._id }),
        ]);
        return (0, api_response_1.ok)(res, { message: "Plant deleted successfully by admin" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAdminPlant = deleteAdminPlant;
