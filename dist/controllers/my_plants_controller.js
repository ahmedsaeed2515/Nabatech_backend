"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFertilizerLogs = exports.fertilizePlant = exports.getPlantDiagnoses = exports.getPlantReminders = exports.getPlantDiaries = exports.getPlantDashboard = exports.uploadPlantImage = exports.getWateringLogs = exports.waterPlant = exports.deletePlant = exports.deleteCloudinaryImage = exports.updatePlant = exports.addPlant = exports.getPlantById = exports.getMyPlants = void 0;
const my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
const watering_log_model_1 = __importDefault(require("../models/watering_log_model"));
const diary_entry_model_1 = __importDefault(require("../models/diary_entry_model"));
const reminder_model_1 = __importDefault(require("../models/reminder_model"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const fertilizer_log_model_1 = __importDefault(require("../models/fertilizer_log_model"));
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const idempotency_record_model_1 = __importDefault(require("../models/idempotency_record_model"));
const crypto_1 = __importDefault(require("crypto"));
const app_error_1 = require("../utils/app_error");
const api_response_1 = require("../utils/api_response");
// @desc    Get all plants of the user
// @route   GET /api/my-plants
// @access  Private
const getMyPlants = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const { search, sort, healthStatus, species, location } = req.query;
        const query = { user: userId };
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
        if (location)
            query.location = location;
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
            .limit(limit);
        return (0, api_response_1.ok)(res, {
            count: plants.length,
            total,
            page,
            totalPages: Math.ceil(total / limit),
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
    }
    catch (error) {
        next(error);
    }
};
exports.getMyPlants = getMyPlants;
// @desc    Get a single plant by ID
// @route   GET /api/my-plants/:id
// @access  Private
const getPlantById = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const plant = await my_plant_model_1.default.findOne({ _id: req.params.id, user: userId });
        if (!plant) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
        }
        return (0, api_response_1.ok)(res, {
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
    }
    catch (error) {
        next(error);
    }
};
exports.getPlantById = getPlantById;
// @desc    Add a new plant
// @route   POST /api/my-plants
// @access  Private
const addPlant = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, species, imageUrl, location, waterFrequencyDays, lastWatered, healthStatus, plantLibraryId, enableNotifications } = req.body;
        if (!name || !species || !location || waterFrequencyDays === undefined) {
            throw new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: 'Name, species, location and water frequency are required' });
        }
        if (waterFrequencyDays !== undefined && Number(waterFrequencyDays) < 1) {
            throw new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: 'waterFrequencyDays must be at least 1' });
        }
        const idempotencyKey = req.headers['idempotency-key'];
        let idempotencyRecord = null;
        if (idempotencyKey) {
            const requestHash = crypto_1.default.createHash('md5').update(JSON.stringify(req.body)).digest('hex');
            idempotencyRecord = await idempotency_record_model_1.default.findOne({ actor: userId, scope: 'my-plants:add', key: idempotencyKey });
            if (idempotencyRecord) {
                if (idempotencyRecord.requestHash !== requestHash) {
                    throw new app_error_1.AppError({ code: 'CONFLICT', statusCode: 409, message: 'Idempotency key already used with different payload' });
                }
                if (idempotencyRecord.state === 'completed') {
                    const plant = await my_plant_model_1.default.findById(idempotencyRecord.resultReference);
                    if (plant) {
                        const result = {
                            plant: {
                                id: plant._id,
                                name: plant.name,
                                species: plant.species,
                                imageUrl: plant.imageUrl,
                                location: plant.location,
                                waterFrequencyDays: plant.waterFrequencyDays,
                                lastWatered: plant.lastWatered,
                                plantLibraryId: plant.plantLibraryId,
                                enableNotifications: plant.enableNotifications,
                                healthStatus: plant.healthStatus,
                                createdAt: plant.createdAt,
                            }
                        };
                        return (0, api_response_1.created)(res, result, result);
                    }
                }
                if (idempotencyRecord.state === 'started') {
                    throw new app_error_1.AppError({ code: 'CONFLICT', statusCode: 409, message: 'Request is already in progress' });
                }
            }
            else {
                idempotencyRecord = await idempotency_record_model_1.default.create({
                    actor: userId,
                    scope: 'my-plants:add',
                    key: idempotencyKey,
                    requestHash,
                    state: 'started',
                    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
                });
            }
        }
        const plant = await my_plant_model_1.default.create({
            user: userId,
            name: name.trim(),
            species: species.trim(),
            imageUrl: imageUrl || "",
            location,
            waterFrequencyDays: Number(waterFrequencyDays),
            lastWatered: lastWatered ? new Date(lastWatered) : undefined,
            plantLibraryId: plantLibraryId || undefined,
            enableNotifications: enableNotifications !== undefined ? enableNotifications : true,
            healthStatus: healthStatus || "excellent",
        });
        if (plant.enableNotifications) {
            const nextDate = new Date(plant.lastWatered.getTime() + plant.waterFrequencyDays * 24 * 60 * 60 * 1000);
            await reminder_model_1.default.create({
                user: userId,
                plantId: plant._id,
                title: `Water ${plant.name}`,
                timeLabel: 'Auto',
                scheduledAt: nextDate,
                enabled: true,
            });
        }
        const result = {
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
        if (idempotencyRecord) {
            idempotencyRecord.state = 'completed';
            idempotencyRecord.statusCode = 201;
            idempotencyRecord.resultReference = plant._id;
            await idempotencyRecord.save();
        }
        return (0, api_response_1.created)(res, result, result);
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            next(new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error.message }));
        }
        else {
            next(error);
        }
    }
};
exports.addPlant = addPlant;
// @desc    Update a plant
// @route   PUT /api/my-plants/:id
// @access  Private
const updatePlant = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { name, species, imageUrl, location, waterFrequencyDays, lastWatered, healthStatus, plantLibraryId, enableNotifications } = req.body;
        if (waterFrequencyDays !== undefined && Number(waterFrequencyDays) < 1) {
            return res.status(400).json({ success: false, message: "waterFrequencyDays must be at least 1" });
        }
        const plant = await my_plant_model_1.default.findOne({ _id: req.params.id, user: userId });
        if (!plant) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
        }
        if (name !== undefined)
            plant.name = name.trim();
        if (species !== undefined)
            plant.species = species.trim();
        if (imageUrl !== undefined && imageUrl !== plant.imageUrl) {
            if (plant.imageUrl) {
                await (0, exports.deleteCloudinaryImage)(plant.imageUrl);
            }
            plant.imageUrl = imageUrl;
        }
        if (location !== undefined)
            plant.location = location;
        if (waterFrequencyDays !== undefined)
            plant.waterFrequencyDays = Number(waterFrequencyDays);
        if (lastWatered !== undefined)
            plant.lastWatered = new Date(lastWatered);
        if (healthStatus !== undefined)
            plant.healthStatus = healthStatus;
        if (plantLibraryId !== undefined)
            plant.plantLibraryId = plantLibraryId;
        const oldEnableNotifications = plant.enableNotifications;
        if (enableNotifications !== undefined)
            plant.enableNotifications = enableNotifications;
        await plant.save();
        if (enableNotifications !== undefined || waterFrequencyDays !== undefined || lastWatered !== undefined) {
            if (!plant.enableNotifications) {
                await reminder_model_1.default.deleteMany({ plantId: plant._id });
            }
            else {
                const nextDate = new Date(plant.lastWatered.getTime() + plant.waterFrequencyDays * 24 * 60 * 60 * 1000);
                const existingReminder = await reminder_model_1.default.findOne({ plantId: plant._id });
                if (existingReminder) {
                    existingReminder.scheduledAt = nextDate;
                    existingReminder.title = `Water ${plant.name}`;
                    await existingReminder.save();
                }
                else {
                    await reminder_model_1.default.create({
                        user: userId,
                        plantId: plant._id,
                        title: `Water ${plant.name}`,
                        timeLabel: 'Auto',
                        scheduledAt: nextDate,
                        enabled: true,
                    });
                }
            }
        }
        return (0, api_response_1.ok)(res, {
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
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            next(new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error.message }));
        }
        else {
            next(error);
        }
    }
};
exports.updatePlant = updatePlant;
const deleteCloudinaryImage = async (imageUrl) => {
    if (!imageUrl || !imageUrl.includes('cloudinary.com'))
        return;
    try {
        const urlParts = imageUrl.split('/');
        // e.g. https://res.cloudinary.com/cloud_name/image/upload/v12345/my_folder/my_image.jpg
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex === -1)
            return;
        // Everything after upload/vXXX/ is the public_id, minus extension
        const pathAfterUpload = urlParts.slice(uploadIndex + 2).join('/');
        const publicId = pathAfterUpload.split('.')[0];
        await cloudinary_1.default.uploader.destroy(publicId);
    }
    catch (err) {
        console.error("Failed to delete image from cloudinary:", err);
    }
};
exports.deleteCloudinaryImage = deleteCloudinaryImage;
// @desc    Delete a plant
// @route   DELETE /api/my-plants/:id
// @access  Private
const deletePlant = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const plant = await my_plant_model_1.default.findOneAndDelete({ _id: req.params.id, user: userId });
        if (!plant) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found or unauthorized' });
        }
        if (plant.imageUrl) {
            await (0, exports.deleteCloudinaryImage)(plant.imageUrl);
        }
        await Promise.all([
            watering_log_model_1.default.deleteMany({ plant: plant._id }),
            diary_entry_model_1.default.deleteMany({ plantId: plant._id }),
            reminder_model_1.default.deleteMany({ plantId: plant._id }),
            diagnosis_history_model_1.default.deleteMany({ plantId: plant._id }),
        ]);
        return (0, api_response_1.ok)(res, {
            message: "Plant deleted successfully"
        });
    }
    catch (error) {
        next(error);
    }
};
exports.deletePlant = deletePlant;
// @desc    Log plant watering
// @route   POST /api/my-plants/:id/water
// @access  Private
const waterPlant = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { wateredAt, note } = req.body;
        const plant = await my_plant_model_1.default.findOne({ _id: req.params.id, user: userId });
        if (!plant) {
            return res.status(404).json({ message: "Plant not found" });
        }
        const wateredDate = wateredAt ? new Date(wateredAt) : new Date();
        plant.lastWatered = wateredDate;
        await plant.save();
        const log = await watering_log_model_1.default.create({
            plant: plant._id,
            user: userId,
            wateredAt: wateredDate,
            note: note?.trim(),
        });
        return (0, api_response_1.ok)(res, {
            message: "Watering logged successfully",
            lastWatered: plant.lastWatered,
            log: { id: log._id, wateredAt: log.wateredAt, note: log.note },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.waterPlant = waterPlant;
// @desc    Get watering logs for a plant
// @route   GET /api/my-plants/:id/water-logs
// @access  Private
const getWateringLogs = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const plant = await my_plant_model_1.default.findOne({ _id: req.params.id, user: userId });
        if (!plant) {
            return res.status(404).json({ success: false, message: "Plant not found" });
        }
        const logs = await watering_log_model_1.default.find({ plant: req.params.id, user: userId })
            .sort({ wateredAt: -1 })
            .limit(50);
        return (0, api_response_1.ok)(res, {
            count: logs.length,
            logs: logs.map(l => ({ id: l._id, wateredAt: l.wateredAt, note: l.note })),
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getWateringLogs = getWateringLogs;
// @desc    Upload plant image to Cloudinary
// @route   POST /api/my-plants/:id/image
// @access  Private
const uploadPlantImage = async (req, res, next) => {
    try {
        const userId = req.user.id;
        if (!req.file) {
            return res.status(400).json({ success: false, message: "No file uploaded" });
        }
        const plant = await my_plant_model_1.default.findOne({ _id: req.params.id, user: userId });
        if (!plant) {
            return res.status(404).json({ success: false, message: "Plant not found" });
        }
        const imageUrl = await new Promise((resolve, reject) => {
            const stream = cloudinary_1.default.uploader.upload_stream({ folder: "my_plants" }, (error, result) => {
                if (error)
                    return reject(error);
                resolve(result.secure_url);
            });
            stream.end(req.file.buffer);
        });
        if (plant.imageUrl) {
            await (0, exports.deleteCloudinaryImage)(plant.imageUrl);
        }
        plant.imageUrl = imageUrl;
        await plant.save();
        return (0, api_response_1.ok)(res, {
            imageUrl,
            plant: { id: plant._id, imageUrl: plant.imageUrl }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.uploadPlantImage = uploadPlantImage;
// @desc    Get dashboard analytics for a plant
// @route   GET /api/my-plants/:id/dashboard
// @access  Private
const getPlantDashboard = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const plantId = req.params.id;
        const plant = await my_plant_model_1.default.findOne({ _id: plantId, user: userId });
        if (!plant) {
            return res.status(404).json({ success: false, message: "Plant not found" });
        }
        const [waterings, diaries, diagnoses, reminders] = await Promise.all([
            watering_log_model_1.default.countDocuments({ plant: plantId }),
            diary_entry_model_1.default.countDocuments({ plantId: plantId }),
            diagnosis_history_model_1.default.countDocuments({ plantId: plantId }),
            reminder_model_1.default.countDocuments({ plantId: plantId }),
        ]);
        const daysAlive = Math.floor((Date.now() - new Date(plant.createdAt).getTime()) / (1000 * 60 * 60 * 24));
        return (0, api_response_1.ok)(res, {
            totalWaterings: waterings,
            totalDiaries: diaries,
            totalDiagnoses: diagnoses,
            totalReminders: reminders,
            daysAlive: daysAlive >= 0 ? daysAlive : 0,
            healthStatus: plant.healthStatus,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPlantDashboard = getPlantDashboard;
// @desc    Get diaries for a plant
// @route   GET /api/my-plants/:id/diaries
// @access  Private
const getPlantDiaries = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const plantId = req.params.id;
        const plant = await my_plant_model_1.default.findOne({ _id: plantId, user: userId });
        if (!plant) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
        }
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const skip = (page - 1) * limit;
        const diaries = await diary_entry_model_1.default.find({ plantId, user: userId })
            .sort({ date: -1 })
            .skip(skip)
            .limit(limit)
            .select('_id title date imageUrl content')
            .lean();
        const count = await diary_entry_model_1.default.countDocuments({ plantId, user: userId });
        const formattedDiaries = diaries.map((diary) => {
            const { _id, ...rest } = diary;
            return { id: _id, ...rest };
        });
        return (0, api_response_1.ok)(res, {
            count,
            diaries: formattedDiaries,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPlantDiaries = getPlantDiaries;
// @desc    Get reminders for a plant
// @route   GET /api/my-plants/:id/reminders
// @access  Private
const getPlantReminders = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const plantId = req.params.id;
        const plant = await my_plant_model_1.default.findOne({ _id: plantId, user: userId });
        if (!plant) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
        }
        const reminders = await reminder_model_1.default.find({ plantId, user: userId })
            .select('_id title scheduledAt type isCompleted')
            .lean();
        const formattedReminders = reminders.map((reminder) => {
            const { _id, ...rest } = reminder;
            return { id: _id, ...rest };
        });
        return (0, api_response_1.ok)(res, {
            count: formattedReminders.length,
            reminders: formattedReminders,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPlantReminders = getPlantReminders;
// @desc    Get diagnoses for a plant
// @route   GET /api/my-plants/:id/diagnoses
// @access  Private
const getPlantDiagnoses = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const plantId = req.params.id;
        const plant = await my_plant_model_1.default.findOne({ _id: plantId, user: userId });
        if (!plant) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
        }
        const diagnoses = await diagnosis_history_model_1.default.find({ plantId, user: userId })
            .sort({ diagnosedAt: -1 })
            .limit(10)
            .select('_id diseaseName confidence diagnosedAt imageUrl')
            .lean();
        const formattedDiagnoses = diagnoses.map((diagnosis) => {
            const { _id, ...rest } = diagnosis;
            return { id: _id, ...rest };
        });
        return (0, api_response_1.ok)(res, {
            count: formattedDiagnoses.length,
            diagnoses: formattedDiagnoses,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getPlantDiagnoses = getPlantDiagnoses;
// @desc    Log plant fertilization
// @route   POST /api/my-plants/:id/fertilize
// @access  Private
const fertilizePlant = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const plantId = req.params.id;
        const { fertilizedAt, fertilizerType, amountGrams, note, clientOperationId } = req.body;
        const plant = await my_plant_model_1.default.findOne({ _id: plantId, user: userId });
        if (!plant) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
        }
        if (clientOperationId) {
            const existingLog = await fertilizer_log_model_1.default.findOne({ clientOperationId, user: userId });
            if (existingLog) {
                return (0, api_response_1.ok)(res, {
                    message: "Fertilization already logged",
                    log: {
                        id: existingLog._id,
                        fertilizedAt: existingLog.fertilizedAt,
                        fertilizerType: existingLog.fertilizerType,
                        amountGrams: existingLog.amountGrams,
                        note: existingLog.note,
                    }
                });
            }
        }
        const log = await fertilizer_log_model_1.default.create({
            user: userId,
            plant: plantId,
            fertilizedAt: fertilizedAt ? new Date(fertilizedAt) : new Date(),
            fertilizerType,
            amountGrams,
            note: note?.trim(),
            clientOperationId
        });
        plant.lastFertilized = log.fertilizedAt;
        await plant.save();
        return (0, api_response_1.created)(res, {
            message: "Fertilization logged successfully",
            log: {
                id: log._id,
                fertilizedAt: log.fertilizedAt,
                fertilizerType: log.fertilizerType,
                amountGrams: log.amountGrams,
                note: log.note,
            }
        });
    }
    catch (error) {
        if (error.name === 'ValidationError') {
            next(new app_error_1.AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error.message }));
        }
        else {
            next(error);
        }
    }
};
exports.fertilizePlant = fertilizePlant;
// @desc    Get fertilizer logs for a plant
// @route   GET /api/my-plants/:id/fertilizer-logs
// @access  Private
const getFertilizerLogs = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const plantId = req.params.id;
        const plant = await my_plant_model_1.default.findOne({ _id: plantId, user: userId });
        if (!plant) {
            throw new app_error_1.AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
        }
        const logs = await fertilizer_log_model_1.default.find({ plant: plantId, user: userId })
            .sort({ fertilizedAt: -1 })
            .lean();
        return (0, api_response_1.ok)(res, {
            count: logs.length,
            logs: logs.map((log) => {
                const { _id, ...rest } = log;
                return { id: _id, ...rest };
            })
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getFertilizerLogs = getFertilizerLogs;
