"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFertilizerLogs = exports.fertilizePlant = exports.getPlantDiagnoses = exports.getPlantReminders = exports.getPlantDiaries = exports.getPlantDashboard = exports.uploadPlantImage = exports.getWateringLogs = exports.waterPlant = exports.deletePlant = exports.deleteCloudinaryImage = exports.updatePlant = exports.addPlant = exports.getPlantById = exports.getMyPlants = void 0;
var my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
var watering_log_model_1 = __importDefault(require("../models/watering_log_model"));
var diary_entry_model_1 = __importDefault(require("../models/diary_entry_model"));
var reminder_model_1 = __importDefault(require("../models/reminder_model"));
var diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
var fertilizer_log_model_1 = __importDefault(require("../models/fertilizer_log_model"));
var cloudinary_1 = __importDefault(require("../config/cloudinary"));
var idempotency_record_model_1 = __importDefault(require("../models/idempotency_record_model"));
var crypto_1 = __importDefault(require("crypto"));
var app_error_1 = require("../utils/app_error");
var api_response_1 = require("../utils/api_response");
// @desc    Get all plants of the user
// @route   GET /api/my-plants
// @access  Private
var getMyPlants = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, page, limit, skip, _a, search, sort, healthStatus, species, location_1, query, sortOption, total, plants, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = req.user.id;
                page = parseInt(req.query.page, 10) || 1;
                limit = parseInt(req.query.limit, 10) || 20;
                skip = (page - 1) * limit;
                _a = req.query, search = _a.search, sort = _a.sort, healthStatus = _a.healthStatus, species = _a.species, location_1 = _a.location;
                query = { user: userId };
                if (search) {
                    query.$or = [
                        { name: { $regex: search, $options: "i" } },
                        { species: { $regex: search, $options: "i" } }
                    ];
                }
                if (healthStatus)
                    query.healthStatus = healthStatus;
                if (species)
                    query.species = species;
                if (location_1)
                    query.location = location_1;
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
                        .limit(limit)];
            case 2:
                plants = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        count: plants.length,
                        total: total,
                        page: page,
                        totalPages: Math.ceil(total / limit),
                        plants: plants.map(function (p) { return ({
                            id: p._id,
                            name: p.name,
                            species: p.species,
                            imageUrl: p.imageUrl,
                            location: p.location,
                            waterFrequencyDays: p.waterFrequencyDays,
                            lastWatered: p.lastWatered,
                            healthStatus: p.healthStatus,
                            createdAt: p.createdAt,
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
exports.getMyPlants = getMyPlants;
// @desc    Get a single plant by ID
// @route   GET /api/my-plants/:id
// @access  Private
var getPlantById = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, plant, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                userId = req.user.id;
                return [4 /*yield*/, my_plant_model_1.default.findOne({ _id: req.params.id, user: userId })];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
                }
                return [2 /*return*/, (0, api_response_1.ok)(res, {
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
                    })];
            case 2:
                error_2 = _a.sent();
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getPlantById = getPlantById;
// @desc    Add a new plant
// @route   POST /api/my-plants
// @access  Private
var addPlant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, name_1, species, imageUrl, location_2, waterFrequencyDays, lastWatered, healthStatus, plantLibraryId, enableNotifications, clientOperationId, idempotencyKey, idempotencyRecord, requestHash, plant_1, result_1, plant, nextDate, result, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 12, , 13]);
                userId = req.user.id;
                _a = req.body, name_1 = _a.name, species = _a.species, imageUrl = _a.imageUrl, location_2 = _a.location, waterFrequencyDays = _a.waterFrequencyDays, lastWatered = _a.lastWatered, healthStatus = _a.healthStatus, plantLibraryId = _a.plantLibraryId, enableNotifications = _a.enableNotifications, clientOperationId = _a.clientOperationId;
                if (!name_1 || !species || !location_2 || waterFrequencyDays === undefined) {
                    throw new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: 'Name, species, location and water frequency are required' });
                }
                if (waterFrequencyDays !== undefined && Number(waterFrequencyDays) < 1) {
                    throw new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: 'waterFrequencyDays must be at least 1' });
                }
                idempotencyKey = req.headers['idempotency-key'] || clientOperationId;
                idempotencyRecord = null;
                if (!idempotencyKey) return [3 /*break*/, 6];
                requestHash = crypto_1.default.createHash('md5').update(JSON.stringify(req.body)).digest('hex');
                return [4 /*yield*/, idempotency_record_model_1.default.findOne({ actor: userId, scope: 'my-plants:add', key: idempotencyKey })];
            case 1:
                idempotencyRecord = _b.sent();
                if (!idempotencyRecord) return [3 /*break*/, 4];
                if (idempotencyRecord.requestHash !== requestHash) {
                    throw new app_error_1.AppError({ code: 'CONFLICT', statusCode: 409, message: 'Idempotency key already used with different payload' });
                }
                if (!(idempotencyRecord.state === 'completed')) return [3 /*break*/, 3];
                return [4 /*yield*/, my_plant_model_1.default.findById(idempotencyRecord.resultReference)];
            case 2:
                plant_1 = _b.sent();
                if (plant_1) {
                    result_1 = {
                        plant: {
                            id: plant_1._id,
                            name: plant_1.name,
                            species: plant_1.species,
                            imageUrl: plant_1.imageUrl,
                            location: plant_1.location,
                            waterFrequencyDays: plant_1.waterFrequencyDays,
                            lastWatered: plant_1.lastWatered,
                            plantLibraryId: plant_1.plantLibraryId,
                            enableNotifications: plant_1.enableNotifications,
                            healthStatus: plant_1.healthStatus,
                            createdAt: plant_1.createdAt,
                        }
                    };
                    return [2 /*return*/, (0, api_response_1.created)(res, result_1, result_1)];
                }
                _b.label = 3;
            case 3:
                if (idempotencyRecord.state === 'started') {
                    throw new app_error_1.AppError({ code: 'CONFLICT', statusCode: 409, message: 'Request is already in progress' });
                }
                return [3 /*break*/, 6];
            case 4: return [4 /*yield*/, idempotency_record_model_1.default.create({
                    actor: userId,
                    scope: 'my-plants:add',
                    key: idempotencyKey,
                    requestHash: requestHash,
                    state: 'started',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                })];
            case 5:
                idempotencyRecord = _b.sent();
                _b.label = 6;
            case 6: return [4 /*yield*/, my_plant_model_1.default.create({
                    user: userId,
                    name: name_1.trim(),
                    species: species.trim(),
                    imageUrl: imageUrl || "",
                    location: location_2,
                    waterFrequencyDays: Number(waterFrequencyDays),
                    lastWatered: lastWatered ? new Date(lastWatered) : undefined,
                    plantLibraryId: plantLibraryId || undefined,
                    enableNotifications: enableNotifications !== undefined ? enableNotifications : true,
                    healthStatus: healthStatus || "excellent",
                })];
            case 7:
                plant = _b.sent();
                if (!plant.enableNotifications) return [3 /*break*/, 9];
                nextDate = new Date(plant.lastWatered.getTime() + plant.waterFrequencyDays * 24 * 60 * 60 * 1000);
                return [4 /*yield*/, reminder_model_1.default.create({
                        user: userId,
                        plantId: plant._id,
                        title: "Water ".concat(plant.name),
                        timeLabel: 'Auto',
                        scheduledAt: nextDate,
                        enabled: true,
                    })];
            case 8:
                _b.sent();
                _b.label = 9;
            case 9:
                result = {
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
                };
                if (!idempotencyRecord) return [3 /*break*/, 11];
                idempotencyRecord.state = 'completed';
                idempotencyRecord.statusCode = 201;
                idempotencyRecord.resultReference = plant._id;
                return [4 /*yield*/, idempotencyRecord.save()];
            case 10:
                _b.sent();
                _b.label = 11;
            case 11: return [2 /*return*/, (0, api_response_1.created)(res, result, result)];
            case 12:
                error_3 = _b.sent();
                if (error_3.name === 'ValidationError') {
                    next(new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error_3.message }));
                }
                else {
                    next(error_3);
                }
                return [3 /*break*/, 13];
            case 13: return [2 /*return*/];
        }
    });
}); };
exports.addPlant = addPlant;
// @desc    Update a plant
// @route   PUT /api/my-plants/:id
// @access  Private
var updatePlant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, name_2, species, imageUrl, location_3, waterFrequencyDays, lastWatered, healthStatus, plantLibraryId, enableNotifications, plant, oldEnableNotifications, nextDate, existingReminder, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 13, , 14]);
                userId = req.user.id;
                _a = req.body, name_2 = _a.name, species = _a.species, imageUrl = _a.imageUrl, location_3 = _a.location, waterFrequencyDays = _a.waterFrequencyDays, lastWatered = _a.lastWatered, healthStatus = _a.healthStatus, plantLibraryId = _a.plantLibraryId, enableNotifications = _a.enableNotifications;
                if (waterFrequencyDays !== undefined && Number(waterFrequencyDays) < 1) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "waterFrequencyDays must be at least 1" })];
                }
                return [4 /*yield*/, my_plant_model_1.default.findOne({ _id: req.params.id, user: userId })];
            case 1:
                plant = _b.sent();
                if (!plant) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
                }
                if (name_2 !== undefined)
                    plant.name = name_2.trim();
                if (species !== undefined)
                    plant.species = species.trim();
                if (!(imageUrl !== undefined && imageUrl !== plant.imageUrl)) return [3 /*break*/, 4];
                if (!plant.imageUrl) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, exports.deleteCloudinaryImage)(plant.imageUrl)];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3:
                plant.imageUrl = imageUrl;
                _b.label = 4;
            case 4:
                if (location_3 !== undefined)
                    plant.location = location_3;
                if (waterFrequencyDays !== undefined)
                    plant.waterFrequencyDays = Number(waterFrequencyDays);
                if (lastWatered !== undefined)
                    plant.lastWatered = new Date(lastWatered);
                if (healthStatus !== undefined)
                    plant.healthStatus = healthStatus;
                if (plantLibraryId !== undefined)
                    plant.plantLibraryId = plantLibraryId;
                oldEnableNotifications = plant.enableNotifications;
                if (enableNotifications !== undefined)
                    plant.enableNotifications = enableNotifications;
                return [4 /*yield*/, plant.save()];
            case 5:
                _b.sent();
                if (!(enableNotifications !== undefined || waterFrequencyDays !== undefined || lastWatered !== undefined)) return [3 /*break*/, 12];
                if (!!plant.enableNotifications) return [3 /*break*/, 7];
                return [4 /*yield*/, reminder_model_1.default.deleteMany({ plantId: plant._id })];
            case 6:
                _b.sent();
                return [3 /*break*/, 12];
            case 7:
                nextDate = new Date(plant.lastWatered.getTime() + plant.waterFrequencyDays * 24 * 60 * 60 * 1000);
                return [4 /*yield*/, reminder_model_1.default.findOne({ plantId: plant._id })];
            case 8:
                existingReminder = _b.sent();
                if (!existingReminder) return [3 /*break*/, 10];
                existingReminder.scheduledAt = nextDate;
                existingReminder.title = "Water ".concat(plant.name);
                return [4 /*yield*/, existingReminder.save()];
            case 9:
                _b.sent();
                return [3 /*break*/, 12];
            case 10: return [4 /*yield*/, reminder_model_1.default.create({
                    user: userId,
                    plantId: plant._id,
                    title: "Water ".concat(plant.name),
                    timeLabel: 'Auto',
                    scheduledAt: nextDate,
                    enabled: true,
                })];
            case 11:
                _b.sent();
                _b.label = 12;
            case 12: return [2 /*return*/, (0, api_response_1.ok)(res, {
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
                })];
            case 13:
                error_4 = _b.sent();
                if (error_4.name === 'ValidationError') {
                    next(new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error_4.message }));
                }
                else {
                    next(error_4);
                }
                return [3 /*break*/, 14];
            case 14: return [2 /*return*/];
        }
    });
}); };
exports.updatePlant = updatePlant;
var deleteCloudinaryImage = function (imageUrl) { return __awaiter(void 0, void 0, void 0, function () {
    var urlParts, uploadIndex, pathAfterUpload, publicId, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!imageUrl || !imageUrl.includes('cloudinary.com'))
                    return [2 /*return*/];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                urlParts = imageUrl.split('/');
                uploadIndex = urlParts.indexOf('upload');
                if (uploadIndex === -1)
                    return [2 /*return*/];
                pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
                publicId = pathAfterUpload.split('.')[0];
                return [4 /*yield*/, cloudinary_1.default.uploader.destroy(publicId)];
            case 2:
                _a.sent();
                return [3 /*break*/, 4];
            case 3:
                err_1 = _a.sent();
                console.error("Failed to delete image from cloudinary:", err_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteCloudinaryImage = deleteCloudinaryImage;
// @desc    Delete a plant
// @route   DELETE /api/my-plants/:id
// @access  Private
var deletePlant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, plant, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                userId = req.user.id;
                return [4 /*yield*/, my_plant_model_1.default.findOneAndDelete({ _id: req.params.id, user: userId })];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found or unauthorized' });
                }
                if (!plant.imageUrl) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, exports.deleteCloudinaryImage)(plant.imageUrl)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [4 /*yield*/, Promise.all([
                    watering_log_model_1.default.deleteMany({ plant: plant._id }),
                    diary_entry_model_1.default.deleteMany({ plantId: plant._id }),
                    reminder_model_1.default.deleteMany({ plantId: plant._id }),
                    diagnosis_history_model_1.default.deleteMany({ plantId: plant._id }),
                    fertilizer_log_model_1.default.deleteMany({ plant: plant._id }),
                ])];
            case 4:
                _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        message: "Plant deleted successfully"
                    })];
            case 5:
                error_5 = _a.sent();
                next(error_5);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.deletePlant = deletePlant;
// @desc    Log plant watering
// @route   POST /api/my-plants/:id/water
// @access  Private
var waterPlant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, wateredAt, note, plant, wateredDate, log, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                userId = req.user.id;
                _a = req.body, wateredAt = _a.wateredAt, note = _a.note;
                return [4 /*yield*/, my_plant_model_1.default.findOne({ _id: req.params.id, user: userId })];
            case 1:
                plant = _b.sent();
                if (!plant) {
                    return [2 /*return*/, res.status(404).json({ message: "Plant not found" })];
                }
                wateredDate = wateredAt ? new Date(wateredAt) : new Date();
                plant.lastWatered = wateredDate;
                return [4 /*yield*/, plant.save()];
            case 2:
                _b.sent();
                return [4 /*yield*/, watering_log_model_1.default.create({
                        plant: plant._id,
                        user: userId,
                        wateredAt: wateredDate,
                        note: note === null || note === void 0 ? void 0 : note.trim(),
                    })];
            case 3:
                log = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        message: "Watering logged successfully",
                        lastWatered: plant.lastWatered,
                        log: { id: log._id, wateredAt: log.wateredAt, note: log.note },
                    })];
            case 4:
                error_6 = _b.sent();
                next(error_6);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.waterPlant = waterPlant;
// @desc    Get watering logs for a plant
// @route   GET /api/my-plants/:id/water-logs
// @access  Private
var getWateringLogs = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, plant, logs, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.id;
                return [4 /*yield*/, my_plant_model_1.default.findOne({ _id: req.params.id, user: userId })];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Plant not found" })];
                }
                return [4 /*yield*/, watering_log_model_1.default.find({ plant: req.params.id, user: userId })
                        .sort({ wateredAt: -1 })
                        .limit(50)];
            case 2:
                logs = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        count: logs.length,
                        logs: logs.map(function (l) { return ({ id: l._id, wateredAt: l.wateredAt, note: l.note }); }),
                    })];
            case 3:
                error_7 = _a.sent();
                next(error_7);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getWateringLogs = getWateringLogs;
// @desc    Upload plant image to Cloudinary
// @route   POST /api/my-plants/:id/image
// @access  Private
var uploadPlantImage = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, plant, imageUrl, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                userId = req.user.id;
                if (!req.file) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "No file uploaded" })];
                }
                return [4 /*yield*/, my_plant_model_1.default.findOne({ _id: req.params.id, user: userId })];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Plant not found" })];
                }
                return [4 /*yield*/, new Promise(function (resolve, reject) {
                        var stream = cloudinary_1.default.uploader.upload_stream({ folder: "my_plants" }, function (error, result) {
                            if (error)
                                return reject(error);
                            resolve(result.secure_url);
                        });
                        stream.end(req.file.buffer);
                    })];
            case 2:
                imageUrl = _a.sent();
                if (!plant.imageUrl) return [3 /*break*/, 4];
                return [4 /*yield*/, (0, exports.deleteCloudinaryImage)(plant.imageUrl)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                plant.imageUrl = imageUrl;
                return [4 /*yield*/, plant.save()];
            case 5:
                _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        imageUrl: imageUrl,
                        plant: { id: plant._id, imageUrl: plant.imageUrl }
                    })];
            case 6:
                error_8 = _a.sent();
                next(error_8);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.uploadPlantImage = uploadPlantImage;
// @desc    Get dashboard analytics for a plant
// @route   GET /api/my-plants/:id/dashboard
// @access  Private
var getPlantDashboard = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, plantId, plant, _a, waterings, diaries, diagnoses, reminders, daysAlive, error_9;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                userId = req.user.id;
                plantId = req.params.id;
                return [4 /*yield*/, my_plant_model_1.default.findOne({ _id: plantId, user: userId })];
            case 1:
                plant = _b.sent();
                if (!plant) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Plant not found" })];
                }
                return [4 /*yield*/, Promise.all([
                        watering_log_model_1.default.countDocuments({ plant: plantId }),
                        diary_entry_model_1.default.countDocuments({ plantId: plantId }),
                        diagnosis_history_model_1.default.countDocuments({ plantId: plantId }),
                        reminder_model_1.default.countDocuments({ plantId: plantId }),
                    ])];
            case 2:
                _a = _b.sent(), waterings = _a[0], diaries = _a[1], diagnoses = _a[2], reminders = _a[3];
                daysAlive = Math.floor((Date.now() - new Date(plant.createdAt).getTime()) / (1000 * 60 * 60 * 24));
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        totalWaterings: waterings,
                        totalDiaries: diaries,
                        totalDiagnoses: diagnoses,
                        totalReminders: reminders,
                        daysAlive: daysAlive >= 0 ? daysAlive : 0,
                        healthStatus: plant.healthStatus,
                    })];
            case 3:
                error_9 = _b.sent();
                next(error_9);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getPlantDashboard = getPlantDashboard;
// @desc    Get diaries for a plant
// @route   GET /api/my-plants/:id/diaries
// @access  Private
var getPlantDiaries = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, plantId, plant, page, limit, skip, diaries, count, formattedDiaries, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                userId = req.user.id;
                plantId = req.params.id;
                return [4 /*yield*/, my_plant_model_1.default.findOne({ _id: plantId, user: userId })];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
                }
                page = parseInt(req.query.page, 10) || 1;
                limit = parseInt(req.query.limit, 10) || 10;
                skip = (page - 1) * limit;
                return [4 /*yield*/, diary_entry_model_1.default.find({ plantId: plantId, user: userId })
                        .sort({ date: -1 })
                        .skip(skip)
                        .limit(limit)
                        .select('_id title date imageUrl content')
                        .lean()];
            case 2:
                diaries = _a.sent();
                return [4 /*yield*/, diary_entry_model_1.default.countDocuments({ plantId: plantId, user: userId })];
            case 3:
                count = _a.sent();
                formattedDiaries = diaries.map(function (diary) {
                    var _id = diary._id, rest = __rest(diary, ["_id"]);
                    return __assign({ id: _id }, rest);
                });
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        count: count,
                        diaries: formattedDiaries,
                    })];
            case 4:
                error_10 = _a.sent();
                next(error_10);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getPlantDiaries = getPlantDiaries;
// @desc    Get reminders for a plant
// @route   GET /api/my-plants/:id/reminders
// @access  Private
var getPlantReminders = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, plantId, plant, reminders, formattedReminders, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.id;
                plantId = req.params.id;
                return [4 /*yield*/, my_plant_model_1.default.findOne({ _id: plantId, user: userId })];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
                }
                return [4 /*yield*/, reminder_model_1.default.find({ plantId: plantId, user: userId })
                        .select('_id title scheduledAt type isCompleted')
                        .lean()];
            case 2:
                reminders = _a.sent();
                formattedReminders = reminders.map(function (reminder) {
                    var _id = reminder._id, rest = __rest(reminder, ["_id"]);
                    return __assign({ id: _id }, rest);
                });
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        count: formattedReminders.length,
                        reminders: formattedReminders,
                    })];
            case 3:
                error_11 = _a.sent();
                next(error_11);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getPlantReminders = getPlantReminders;
// @desc    Get diagnoses for a plant
// @route   GET /api/my-plants/:id/diagnoses
// @access  Private
var getPlantDiagnoses = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, plantId, plant, diagnoses, formattedDiagnoses, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.id;
                plantId = req.params.id;
                return [4 /*yield*/, my_plant_model_1.default.findOne({ _id: plantId, user: userId })];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
                }
                return [4 /*yield*/, diagnosis_history_model_1.default.find({ plantId: plantId, user: userId })
                        .sort({ diagnosedAt: -1 })
                        .limit(10)
                        .select('_id diseaseName confidence diagnosedAt imageUrl')
                        .lean()];
            case 2:
                diagnoses = _a.sent();
                formattedDiagnoses = diagnoses.map(function (diagnosis) {
                    var _id = diagnosis._id, rest = __rest(diagnosis, ["_id"]);
                    return __assign({ id: _id }, rest);
                });
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        count: formattedDiagnoses.length,
                        diagnoses: formattedDiagnoses,
                    })];
            case 3:
                error_12 = _a.sent();
                next(error_12);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getPlantDiagnoses = getPlantDiagnoses;
var normalizeFertilizerType = function (type) {
    var _a;
    var upper = type.toUpperCase();
    var mapping = {
        'SLOW-RELEASE': 'SLOW_RELEASE',
    };
    return (_a = mapping[upper]) !== null && _a !== void 0 ? _a : upper;
};
// @desc    Log plant fertilization
// @route   POST /api/my-plants/:id/fertilize
// @access  Private
var fertilizePlant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, plantId, _a, fertilizedAt, fertilizerType, amountGrams, note, clientOperationId, plant, existingLog, log, error_13;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                userId = req.user.id;
                plantId = req.params.id;
                _a = req.body, fertilizedAt = _a.fertilizedAt, fertilizerType = _a.fertilizerType, amountGrams = _a.amountGrams, note = _a.note, clientOperationId = _a.clientOperationId;
                fertilizerType = normalizeFertilizerType(fertilizerType);
                return [4 /*yield*/, my_plant_model_1.default.findOne({ _id: plantId, user: userId })];
            case 1:
                plant = _b.sent();
                if (!plant) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
                }
                if (!clientOperationId) return [3 /*break*/, 3];
                return [4 /*yield*/, fertilizer_log_model_1.default.findOne({ clientOperationId: clientOperationId, user: userId })];
            case 2:
                existingLog = _b.sent();
                if (existingLog) {
                    return [2 /*return*/, (0, api_response_1.ok)(res, {
                            message: "Fertilization already logged",
                            log: {
                                id: existingLog._id,
                                fertilizedAt: existingLog.fertilizedAt,
                                fertilizerType: existingLog.fertilizerType,
                                amountGrams: existingLog.amountGrams,
                                note: existingLog.note,
                            }
                        })];
                }
                _b.label = 3;
            case 3: return [4 /*yield*/, fertilizer_log_model_1.default.create({
                    user: userId,
                    plant: plantId,
                    fertilizedAt: fertilizedAt ? new Date(fertilizedAt) : new Date(),
                    fertilizerType: fertilizerType,
                    amountGrams: amountGrams,
                    note: note === null || note === void 0 ? void 0 : note.trim(),
                    clientOperationId: clientOperationId
                })];
            case 4:
                log = _b.sent();
                plant.lastFertilized = log.fertilizedAt;
                return [4 /*yield*/, plant.save()];
            case 5:
                _b.sent();
                return [2 /*return*/, (0, api_response_1.created)(res, {
                        message: "Fertilization logged successfully",
                        log: {
                            id: log._id,
                            fertilizedAt: log.fertilizedAt,
                            fertilizerType: log.fertilizerType,
                            amountGrams: log.amountGrams,
                            note: log.note,
                        }
                    })];
            case 6:
                error_13 = _b.sent();
                if (error_13.name === 'ValidationError') {
                    next(new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error_13.message }));
                }
                else {
                    next(error_13);
                }
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.fertilizePlant = fertilizePlant;
// @desc    Get fertilizer logs for a plant
// @route   GET /api/my-plants/:id/fertilizer-logs
// @access  Private
var getFertilizerLogs = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, plantId, plant, logs, error_14;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                userId = req.user.id;
                plantId = req.params.id;
                return [4 /*yield*/, my_plant_model_1.default.findOne({ _id: plantId, user: userId })];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
                }
                return [4 /*yield*/, fertilizer_log_model_1.default.find({ plant: plantId, user: userId })
                        .sort({ fertilizedAt: -1 })
                        .lean()];
            case 2:
                logs = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        count: logs.length,
                        logs: logs.map(function (log) {
                            var _id = log._id, rest = __rest(log, ["_id"]);
                            return __assign({ id: _id }, rest);
                        })
                    })];
            case 3:
                error_14 = _a.sent();
                next(error_14);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getFertilizerLogs = getFertilizerLogs;
