"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminUserPlantsStats = exports.deleteAdminUserPlant = exports.updateAdminUserPlant = exports.getAdminUserPlantById = exports.getAdminUserPlants = void 0;
var my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
var watering_log_model_1 = __importDefault(require("../models/watering_log_model"));
var fertilizer_log_model_1 = __importDefault(require("../models/fertilizer_log_model"));
var diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
var ai_report_model_1 = __importDefault(require("../models/ai_report_model"));
var garden_model_1 = __importDefault(require("../models/garden_model"));
var reminder_model_1 = __importDefault(require("../models/reminder_model"));
var diary_entry_model_1 = __importDefault(require("../models/diary_entry_model"));
var api_response_1 = require("../utils/api_response");
var app_error_1 = require("../utils/app_error");
var my_plants_controller_1 = require("./my_plants_controller");
// @desc    Admin: Get all user plants globally
// @route   GET /api/admin/user-plants
// @access  Private/Admin
var getAdminUserPlants = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, skip, _a, search, healthStatus, growthStage, location_1, user, garden, sort, query, sortOption, total, plants, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page, 10) || 1;
                limit = parseInt(req.query.limit, 10) || 20;
                skip = (page - 1) * limit;
                _a = req.query, search = _a.search, healthStatus = _a.healthStatus, growthStage = _a.growthStage, location_1 = _a.location, user = _a.user, garden = _a.garden, sort = _a.sort;
                query = {};
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
                if (location_1)
                    query.location = location_1;
                if (user)
                    query.user = user;
                if (garden)
                    query.garden = garden;
                sortOption = { createdAt: -1 };
                if (sort === "name_asc")
                    sortOption = { name: 1 };
                if (sort === "name_desc")
                    sortOption = { name: -1 };
                if (sort === "oldest")
                    sortOption = { createdAt: 1 };
                if (sort === "needs_water")
                    sortOption = { lastWatered: 1 };
                return [4 /*yield*/, my_plant_model_1.default.countDocuments(query)];
            case 1:
                total = _b.sent();
                return [4 /*yield*/, my_plant_model_1.default.find(query)
                        .sort(sortOption)
                        .skip(skip)
                        .limit(limit)
                        .populate('user', 'firstName lastName email')
                        .populate('garden', 'name type')];
            case 2:
                plants = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        total: total,
                        page: page,
                        totalPages: Math.ceil(total / limit),
                        plants: plants.map(function (p) { return ({
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
                            user: p.user ? { id: p.user._id, name: "".concat(p.user.firstName || '', " ").concat(p.user.lastName || '').trim() || 'Unknown', email: p.user.email } : null,
                            garden: p.garden ? { id: p.garden._id, name: p.garden.name, type: p.garden.type } : null,
                        }); }),
                    })];
            case 3:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAdminUserPlants = getAdminUserPlants;
// @desc    Admin: Get user plant by ID (detailed)
// @route   GET /api/admin/user-plants/:id
// @access  Private/Admin
var getAdminUserPlantById = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var plant, _a, wateringLogs, fertilizerLogs, diagnosisHistory, aiReports, userObj, gardenObj, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, my_plant_model_1.default.findById(req.params.id)
                        .populate('user', 'firstName lastName email')
                        .populate('garden', 'name type score')];
            case 1:
                plant = _b.sent();
                if (!plant) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
                }
                return [4 /*yield*/, Promise.all([
                        watering_log_model_1.default.find({ plant: plant._id }).sort({ wateredAt: -1 }).limit(10),
                        fertilizer_log_model_1.default.find({ plant: plant._id }).sort({ fertilizedAt: -1 }).limit(10),
                        diagnosis_history_model_1.default.find({ plantId: plant._id }).sort({ diagnosedAt: -1 }),
                        ai_report_model_1.default.find({ user: plant.user }).sort({ createdAt: -1 }).limit(5)
                    ])];
            case 2:
                _a = _b.sent(), wateringLogs = _a[0], fertilizerLogs = _a[1], diagnosisHistory = _a[2], aiReports = _a[3];
                userObj = plant.user;
                gardenObj = plant.garden;
                return [2 /*return*/, (0, api_response_1.ok)(res, {
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
                            user: plant.user ? { id: userObj._id, name: "".concat(userObj.firstName || '', " ").concat(userObj.lastName || '').trim() || 'Unknown', email: userObj.email } : null,
                            garden: plant.garden ? { id: gardenObj._id, name: gardenObj.name, type: gardenObj.type, score: gardenObj.score } : null,
                        },
                        wateringLogs: wateringLogs.map(function (log) { return ({
                            id: log._id,
                            wateredAt: log.wateredAt,
                            note: log.note
                        }); }),
                        fertilizerLogs: fertilizerLogs.map(function (log) { return ({
                            id: log._id,
                            fertilizerType: log.fertilizerType,
                            amountGrams: log.amountGrams,
                            fertilizedAt: log.fertilizedAt,
                            note: log.note
                        }); }),
                        diagnosisHistory: diagnosisHistory.map(function (diag) { return ({
                            id: diag._id,
                            diseaseNameAr: diag.diseaseNameAr,
                            diseaseNameEn: diag.diseaseNameEn,
                            confidence: diag.confidence,
                            severity: diag.severity,
                            diagnosedAt: diag.diagnosedAt,
                            imageUrl: diag.imageUrl,
                            advice: diag.advice
                        }); }),
                        aiReports: aiReports.map(function (report) { return ({
                            id: report._id,
                            score: report.score,
                            urgentActions: report.urgentActions,
                            summary: report.summary,
                            createdAt: report.createdAt
                        }); })
                    })];
            case 3:
                error_2 = _b.sent();
                next(error_2);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAdminUserPlantById = getAdminUserPlantById;
// @desc    Admin: Update user plant details
// @route   PUT /api/admin/user-plants/:id
// @access  Private/Admin
var updateAdminUserPlant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, species, location_2, healthStatus, growthStage, waterFrequencyDays, lastWatered, garden, plant, checkGarden, nextWaterDate, existingReminder, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 11, , 12]);
                _a = req.body, name_1 = _a.name, species = _a.species, location_2 = _a.location, healthStatus = _a.healthStatus, growthStage = _a.growthStage, waterFrequencyDays = _a.waterFrequencyDays, lastWatered = _a.lastWatered, garden = _a.garden;
                return [4 /*yield*/, my_plant_model_1.default.findById(req.params.id)];
            case 1:
                plant = _b.sent();
                if (!plant) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
                }
                if (name_1 !== undefined)
                    plant.name = name_1.trim();
                if (species !== undefined)
                    plant.species = species.trim();
                if (location_2 !== undefined)
                    plant.location = location_2;
                if (healthStatus !== undefined)
                    plant.healthStatus = healthStatus;
                if (growthStage !== undefined)
                    plant.growthStage = growthStage;
                if (waterFrequencyDays !== undefined)
                    plant.waterFrequencyDays = Number(waterFrequencyDays);
                if (lastWatered !== undefined)
                    plant.lastWatered = new Date(lastWatered);
                if (!(garden !== undefined)) return [3 /*break*/, 4];
                if (!(garden === "" || garden === null)) return [3 /*break*/, 2];
                plant.garden = undefined;
                return [3 /*break*/, 4];
            case 2: return [4 /*yield*/, garden_model_1.default.findById(garden)];
            case 3:
                checkGarden = _b.sent();
                if (!checkGarden) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Invalid garden ID" })];
                }
                plant.garden = checkGarden._id;
                _b.label = 4;
            case 4: return [4 /*yield*/, plant.save()];
            case 5:
                _b.sent();
                if (!plant.enableNotifications) return [3 /*break*/, 10];
                nextWaterDate = new Date(plant.lastWatered.getTime() + plant.waterFrequencyDays * 24 * 60 * 60 * 1000);
                return [4 /*yield*/, reminder_model_1.default.findOne({ plantId: plant._id })];
            case 6:
                existingReminder = _b.sent();
                if (!existingReminder) return [3 /*break*/, 8];
                existingReminder.scheduledAt = nextWaterDate;
                existingReminder.title = "Water ".concat(plant.name);
                return [4 /*yield*/, existingReminder.save()];
            case 7:
                _b.sent();
                return [3 /*break*/, 10];
            case 8: return [4 /*yield*/, reminder_model_1.default.create({
                    user: plant.user,
                    plantId: plant._id,
                    title: "Water ".concat(plant.name),
                    timeLabel: 'Auto',
                    scheduledAt: nextWaterDate,
                    enabled: true,
                })];
            case 9:
                _b.sent();
                _b.label = 10;
            case 10: return [2 /*return*/, (0, api_response_1.ok)(res, {
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
                })];
            case 11:
                error_3 = _b.sent();
                next(error_3);
                return [3 /*break*/, 12];
            case 12: return [2 /*return*/];
        }
    });
}); };
exports.updateAdminUserPlant = updateAdminUserPlant;
// @desc    Admin: Delete user plant globally
// @route   DELETE /api/admin/user-plants/:id
// @access  Private/Admin
var deleteAdminUserPlant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var plant, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, my_plant_model_1.default.findByIdAndDelete(req.params.id)];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
                }
                if (!plant.imageUrl) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, my_plants_controller_1.deleteCloudinaryImage)(plant.imageUrl).catch(function (err) { })];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: 
            // Clean up all dependencies
            return [4 /*yield*/, Promise.all([
                    watering_log_model_1.default.deleteMany({ plant: plant._id }),
                    fertilizer_log_model_1.default.deleteMany({ plant: plant._id }),
                    reminder_model_1.default.deleteMany({ plantId: plant._id }),
                    diary_entry_model_1.default.deleteMany({ plantId: plant._id }),
                    diagnosis_history_model_1.default.deleteMany({ plantId: plant._id }),
                ])];
            case 4:
                // Clean up all dependencies
                _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "User plant deleted successfully from system" })];
            case 5:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.deleteAdminUserPlant = deleteAdminUserPlant;
// @desc    Admin: Get statistics of user plants globally
// @route   GET /api/admin/user-plants/stats
// @access  Private/Admin
var getAdminUserPlantsStats = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var totalPlants, healthStatusAggregation, healthStats, growthStageAggregation, growthStageStats, locationAggregation, locationStats, popularSpecies, plantsList, totalHealthScore_1, avgHealthScore, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 7, , 8]);
                return [4 /*yield*/, my_plant_model_1.default.countDocuments()];
            case 1:
                totalPlants = _a.sent();
                return [4 /*yield*/, my_plant_model_1.default.aggregate([
                        { $group: { _id: "$healthStatus", count: { $sum: 1 } } }
                    ])];
            case 2:
                healthStatusAggregation = _a.sent();
                healthStats = healthStatusAggregation.reduce(function (acc, curr) {
                    acc[curr._id || 'unknown'] = curr.count;
                    return acc;
                }, {});
                return [4 /*yield*/, my_plant_model_1.default.aggregate([
                        { $group: { _id: { $ifNull: ["$growthStage", "MATURE"] }, count: { $sum: 1 } } }
                    ])];
            case 3:
                growthStageAggregation = _a.sent();
                growthStageStats = growthStageAggregation.reduce(function (acc, curr) {
                    acc[curr._id] = curr.count;
                    return acc;
                }, {});
                return [4 /*yield*/, my_plant_model_1.default.aggregate([
                        { $group: { _id: "$location", count: { $sum: 1 } } }
                    ])];
            case 4:
                locationAggregation = _a.sent();
                locationStats = locationAggregation.reduce(function (acc, curr) {
                    acc[curr._id || 'unknown'] = curr.count;
                    return acc;
                }, {});
                return [4 /*yield*/, my_plant_model_1.default.aggregate([
                        { $group: { _id: "$species", count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 5 }
                    ])];
            case 5:
                popularSpecies = _a.sent();
                return [4 /*yield*/, my_plant_model_1.default.find({}, 'healthStatus')];
            case 6:
                plantsList = _a.sent();
                totalHealthScore_1 = 0;
                plantsList.forEach(function (p) {
                    var status = (p.healthStatus || 'excellent').toLowerCase();
                    if (status === 'excellent' || status === 'ممتازة')
                        totalHealthScore_1 += 100;
                    else if (status === 'good' || status === 'جيدة')
                        totalHealthScore_1 += 85;
                    else if (status === 'needs_care' || status === 'تحتاج رعاية')
                        totalHealthScore_1 += 65;
                    else if (status === 'sick' || status === 'مريضة')
                        totalHealthScore_1 += 45;
                    else if (status === 'critical' || status === 'حرجة')
                        totalHealthScore_1 += 25;
                    else
                        totalHealthScore_1 += 80; // default average
                });
                avgHealthScore = plantsList.length > 0 ? Math.round(totalHealthScore_1 / plantsList.length) : 100;
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        totalPlants: totalPlants,
                        avgHealthScore: avgHealthScore,
                        healthStats: healthStats,
                        growthStageStats: growthStageStats,
                        locationStats: locationStats,
                        popularSpecies: popularSpecies.map(function (s) { return ({ species: s._id, count: s.count }); })
                    })];
            case 7:
                error_5 = _a.sent();
                next(error_5);
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.getAdminUserPlantsStats = getAdminUserPlantsStats;
