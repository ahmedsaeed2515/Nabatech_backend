"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminUserPlantsStats = exports.deleteAdminUserPlant = exports.updateAdminUserPlant = exports.getAdminUserPlantById = exports.getAdminUserPlants = void 0;
const my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
const watering_log_model_1 = __importDefault(require("../models/watering_log_model"));
const fertilizer_log_model_1 = __importDefault(require("../models/fertilizer_log_model"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const ai_report_model_1 = __importDefault(require("../models/ai_report_model"));
const garden_model_1 = __importDefault(require("../models/garden_model"));
const reminder_model_1 = __importDefault(require("../models/reminder_model"));
const diary_entry_model_1 = __importDefault(require("../models/diary_entry_model"));
const api_response_1 = require("../utils/api_response");
const app_error_1 = require("../utils/app_error");
const my_plants_controller_1 = require("./my_plants_controller");
// @desc    Admin: Get all user plants globally
// @route   GET /api/admin/user-plants
// @access  Private/Admin
const getAdminUserPlants = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const { search, healthStatus, growthStage, location, user, garden, sort } = req.query;
        const query = {};
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { species: { $regex: search, $options: "i" } }
            ];
        }
        if (healthStatus)
            query.healthStatus = healthStatus;
        if (growthStage)
            query.growthStage = growthStage;
        if (location)
            query.location = location;
        if (user)
            query.user = user;
        if (garden)
            query.garden = garden;
        let sortOption = { createdAt: -1 };
        if (sort === "name_asc")
            sortOption = { name: 1 };
        if (sort === "name_desc")
            sortOption = { name: -1 };
        if (sort === "oldest")
            sortOption = { createdAt: 1 };
        if (sort === "needs_water")
            sortOption = { lastWatered: 1 };
        const total = await my_plant_model_1.default.countDocuments(query);
        const plants = await my_plant_model_1.default.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .populate('user', 'firstName lastName email')
            .populate('garden', 'name type');
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
                growthStage: p.growthStage || 'MATURE',
                waterFrequencyDays: p.waterFrequencyDays,
                lastWatered: p.lastWatered,
                lastFertilized: p.lastFertilized,
                createdAt: p.createdAt,
                user: p.user ? { id: p.user._id, name: `${p.user.firstName || ''} ${p.user.lastName || ''}`.trim() || 'Unknown', email: p.user.email } : null,
                garden: p.garden ? { id: p.garden._id, name: p.garden.name, type: p.garden.type } : null,
            })),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminUserPlants = getAdminUserPlants;
// @desc    Admin: Get user plant by ID (detailed)
// @route   GET /api/admin/user-plants/:id
// @access  Private/Admin
const getAdminUserPlantById = async (req, res, next) => {
    try {
        const plant = await my_plant_model_1.default.findById(req.params.id)
            .populate('user', 'firstName lastName email')
            .populate('garden', 'name type score');
        if (!plant) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
        }
        // Fetch associated logs in parallel
        const [wateringLogs, fertilizerLogs, diagnosisHistory, aiReports] = await Promise.all([
            watering_log_model_1.default.find({ plant: plant._id }).sort({ wateredAt: -1 }).limit(10),
            fertilizer_log_model_1.default.find({ plant: plant._id }).sort({ fertilizedAt: -1 }).limit(10),
            diagnosis_history_model_1.default.find({ plantId: plant._id }).sort({ diagnosedAt: -1 }),
            ai_report_model_1.default.find({ user: plant.user }).sort({ createdAt: -1 }).limit(5)
        ]);
        const userObj = plant.user;
        const gardenObj = plant.garden;
        return (0, api_response_1.ok)(res, {
            plant: {
                id: plant._id,
                name: plant.name,
                species: plant.species,
                imageUrl: plant.imageUrl,
                location: plant.location,
                healthStatus: plant.healthStatus,
                growthStage: plant.growthStage || 'MATURE',
                waterFrequencyDays: plant.waterFrequencyDays,
                lastWatered: plant.lastWatered,
                lastFertilized: plant.lastFertilized,
                createdAt: plant.createdAt,
                user: plant.user ? { id: userObj._id, name: `${userObj.firstName || ''} ${userObj.lastName || ''}`.trim() || 'Unknown', email: userObj.email } : null,
                garden: plant.garden ? { id: gardenObj._id, name: gardenObj.name, type: gardenObj.type, score: gardenObj.score } : null,
            },
            wateringLogs: wateringLogs.map(log => ({
                id: log._id,
                wateredAt: log.wateredAt,
                note: log.note
            })),
            fertilizerLogs: fertilizerLogs.map(log => ({
                id: log._id,
                fertilizerType: log.fertilizerType,
                amountGrams: log.amountGrams,
                fertilizedAt: log.fertilizedAt,
                note: log.note
            })),
            diagnosisHistory: diagnosisHistory.map(diag => ({
                id: diag._id,
                diseaseNameAr: diag.diseaseNameAr,
                diseaseNameEn: diag.diseaseNameEn,
                confidence: diag.confidence,
                severity: diag.severity,
                diagnosedAt: diag.diagnosedAt,
                imageUrl: diag.imageUrl,
                advice: diag.advice
            })),
            aiReports: aiReports.map(report => ({
                id: report._id,
                score: report.score,
                urgentActions: report.urgentActions,
                summary: report.summary,
                createdAt: report.createdAt
            }))
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminUserPlantById = getAdminUserPlantById;
// @desc    Admin: Update user plant details
// @route   PUT /api/admin/user-plants/:id
// @access  Private/Admin
const updateAdminUserPlant = async (req, res, next) => {
    try {
        const { name, species, location, healthStatus, growthStage, waterFrequencyDays, lastWatered, garden } = req.body;
        const plant = await my_plant_model_1.default.findById(req.params.id);
        if (!plant) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
        }
        if (name !== undefined)
            plant.name = name.trim();
        if (species !== undefined)
            plant.species = species.trim();
        if (location !== undefined)
            plant.location = location;
        if (healthStatus !== undefined)
            plant.healthStatus = healthStatus;
        if (growthStage !== undefined)
            plant.growthStage = growthStage;
        if (waterFrequencyDays !== undefined)
            plant.waterFrequencyDays = Number(waterFrequencyDays);
        if (lastWatered !== undefined)
            plant.lastWatered = new Date(lastWatered);
        if (garden !== undefined) {
            if (garden === "" || garden === null) {
                plant.garden = undefined;
            }
            else {
                const checkGarden = await garden_model_1.default.findById(garden);
                if (!checkGarden) {
                    return res.status(400).json({ success: false, message: "Invalid garden ID" });
                }
                plant.garden = checkGarden._id;
            }
        }
        await plant.save();
        // Sync water reminder if notifications are enabled
        if (plant.enableNotifications) {
            const nextWaterDate = new Date(plant.lastWatered.getTime() + plant.waterFrequencyDays * 24 * 60 * 60 * 1000);
            const existingReminder = await reminder_model_1.default.findOne({ plantId: plant._id });
            if (existingReminder) {
                existingReminder.scheduledAt = nextWaterDate;
                existingReminder.title = `Water ${plant.name}`;
                await existingReminder.save();
            }
            else {
                await reminder_model_1.default.create({
                    user: plant.user,
                    plantId: plant._id,
                    title: `Water ${plant.name}`,
                    timeLabel: 'Auto',
                    scheduledAt: nextWaterDate,
                    enabled: true,
                });
            }
        }
        return (0, api_response_1.ok)(res, {
            message: "Plant updated successfully",
            plant: {
                id: plant._id,
                name: plant.name,
                species: plant.species,
                location: plant.location,
                healthStatus: plant.healthStatus,
                growthStage: plant.growthStage,
                waterFrequencyDays: plant.waterFrequencyDays,
                lastWatered: plant.lastWatered,
                garden: plant.garden
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.updateAdminUserPlant = updateAdminUserPlant;
// @desc    Admin: Delete user plant globally
// @route   DELETE /api/admin/user-plants/:id
// @access  Private/Admin
const deleteAdminUserPlant = async (req, res, next) => {
    try {
        const plant = await my_plant_model_1.default.findByIdAndDelete(req.params.id);
        if (!plant) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
        }
        if (plant.imageUrl) {
            await (0, my_plants_controller_1.deleteCloudinaryImage)(plant.imageUrl).catch(err => { });
        }
        // Clean up all dependencies
        await Promise.all([
            watering_log_model_1.default.deleteMany({ plant: plant._id }),
            fertilizer_log_model_1.default.deleteMany({ plant: plant._id }),
            reminder_model_1.default.deleteMany({ plantId: plant._id }),
            diary_entry_model_1.default.deleteMany({ plantId: plant._id }),
            diagnosis_history_model_1.default.deleteMany({ plantId: plant._id }),
        ]);
        return (0, api_response_1.ok)(res, { message: "User plant deleted successfully from system" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteAdminUserPlant = deleteAdminUserPlant;
// @desc    Admin: Get statistics of user plants globally
// @route   GET /api/admin/user-plants/stats
// @access  Private/Admin
const getAdminUserPlantsStats = async (req, res, next) => {
    try {
        const totalPlants = await my_plant_model_1.default.countDocuments();
        // 1. Health Status Distribution
        const healthStatusAggregation = await my_plant_model_1.default.aggregate([
            { $group: { _id: "$healthStatus", count: { $sum: 1 } } }
        ]);
        const healthStats = healthStatusAggregation.reduce((acc, curr) => {
            acc[curr._id || 'unknown'] = curr.count;
            return acc;
        }, {});
        // 2. Growth Stage Distribution
        const growthStageAggregation = await my_plant_model_1.default.aggregate([
            { $group: { _id: { $ifNull: ["$growthStage", "MATURE"] }, count: { $sum: 1 } } }
        ]);
        const growthStageStats = growthStageAggregation.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, {});
        // 3. Location Distribution
        const locationAggregation = await my_plant_model_1.default.aggregate([
            { $group: { _id: "$location", count: { $sum: 1 } } }
        ]);
        const locationStats = locationAggregation.reduce((acc, curr) => {
            acc[curr._id || 'unknown'] = curr.count;
            return acc;
        }, {});
        // 4. Most Popular Species
        const popularSpecies = await my_plant_model_1.default.aggregate([
            { $group: { _id: "$species", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 }
        ]);
        // 5. Average Health Score estimation
        // Assign numerical score to statuses
        const plantsList = await my_plant_model_1.default.find({}, 'healthStatus');
        let totalHealthScore = 0;
        plantsList.forEach(p => {
            const status = (p.healthStatus || 'excellent').toLowerCase();
            if (status === 'excellent' || status === 'ممتازة')
                totalHealthScore += 100;
            else if (status === 'good' || status === 'جيدة')
                totalHealthScore += 85;
            else if (status === 'needs_care' || status === 'تحتاج رعاية')
                totalHealthScore += 65;
            else if (status === 'sick' || status === 'مريضة')
                totalHealthScore += 45;
            else if (status === 'critical' || status === 'حرجة')
                totalHealthScore += 25;
            else
                totalHealthScore += 80; // default average
        });
        const avgHealthScore = plantsList.length > 0 ? Math.round(totalHealthScore / plantsList.length) : 100;
        return (0, api_response_1.ok)(res, {
            totalPlants,
            avgHealthScore,
            healthStats,
            growthStageStats,
            locationStats,
            popularSpecies: popularSpecies.map(s => ({ species: s._id, count: s.count }))
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminUserPlantsStats = getAdminUserPlantsStats;
