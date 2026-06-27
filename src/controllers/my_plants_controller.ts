import { Request, Response, NextFunction } from "express";
import MyPlant from "../models/my_plant_model";
import WateringLog from "../models/watering_log_model";
import DiaryEntry from "../models/diary_entry_model";
import Reminder from "../models/reminder_model";
import DiagnosisHistory from "../models/diagnosis_history_model";
import FertilizerLog from "../models/fertilizer_log_model";
import cloudinary from "../config/cloudinary";
import IdempotencyRecord from "../models/idempotency_record_model";
import crypto from "crypto";
import { AppError } from "../utils/app_error";
import { ok, created } from "../utils/api_response";

const calculateNextWaterInDays = (lastWatered: Date | undefined, frequency: number): number => {
  if (!lastWatered || frequency <= 0) return frequency || 0;
  const diffTime = Date.now() - new Date(lastWatered).getTime();
  const daysElapsed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, frequency - daysElapsed);
};

// @desc    Get all plants of the user
// @route   GET /api/my-plants
// @access  Private
export const getMyPlants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const { search, sort, healthStatus, species, location } = req.query;

    const query: any = { user: userId };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { species: { $regex: search, $options: "i" } }
      ];
    }
    if (healthStatus) query.healthStatus = healthStatus;
    if (species) query.species = species;
    if (location) query.location = location;

    let sortOption: any = { createdAt: -1 };
    if (sort === "name_asc") sortOption = { name: 1 };
    if (sort === "name_desc") sortOption = { name: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "needs_water") sortOption = { lastWatered: 1 };

    const total = await MyPlant.countDocuments(query);
    const plants = await MyPlant.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    return ok(res, {
      count: plants.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      plants: plants.map(p => ({
        id: p._id,
        _id: p._id,
        name: p.name,
        species: p.species,
        imageUrl: p.imageUrl,
        location: p.location,
        garden: p.garden,
        zone: p.zone,
        room: p.room,
        notes: p.notes,
        waterFrequencyDays: p.waterFrequencyDays,
        lastWatered: p.lastWatered,
        nextWaterInDays: calculateNextWaterInDays(p.lastWatered, p.waterFrequencyDays),
        healthStatus: p.healthStatus,
        confidenceScore: p.confidenceScore,
        aiVerified: p.aiVerified,
        userApproved: p.userApproved,
        createdAt: p.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single plant by ID
// @route   GET /api/my-plants/:id
// @access  Private
export const getPlantById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const plant = await MyPlant.findOne({ _id: req.params.id, user: userId });

    if (!plant) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
    }

    return ok(res, {
      plant: {
        id: plant._id,
        _id: plant._id,
        name: plant.name,
        species: plant.species,
        imageUrl: plant.imageUrl,
        location: plant.location,
        garden: plant.garden,
        zone: plant.zone,
        room: plant.room,
        notes: plant.notes,
        waterFrequencyDays: plant.waterFrequencyDays,
        lastWatered: plant.lastWatered,
        nextWaterInDays: calculateNextWaterInDays(plant.lastWatered, plant.waterFrequencyDays),
        healthStatus: plant.healthStatus,
        confidenceScore: plant.confidenceScore,
        aiVerified: plant.aiVerified,
        userApproved: plant.userApproved,
        createdAt: plant.createdAt,
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add a new plant
// @route   POST /api/my-plants
// @access  Private
export const addPlant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { name, species, scientificName, imageUrl, location, room, notes, waterFrequencyDays, lastWatered, healthStatus, plantLibraryId, enableNotifications, confidenceScore, aiVerified, userApproved, clientOperationId, libraryProfile, gardenId, zoneId } = req.body;

    if (!name || !species || !location || waterFrequencyDays === undefined) {
      throw new AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: 'Name, species, location and water frequency are required' });
    }

    if (waterFrequencyDays !== undefined && Number(waterFrequencyDays) < 1) {
      throw new AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: 'waterFrequencyDays must be at least 1' });
    }

    const idempotencyKey = (req.headers['idempotency-key'] as string) || clientOperationId;
    let idempotencyRecord: any = null;

    if (idempotencyKey) {
      const requestHash = crypto.createHash('md5').update(JSON.stringify(req.body)).digest('hex');
      idempotencyRecord = await IdempotencyRecord.findOne({ actor: userId, scope: 'my-plants:add', key: idempotencyKey });
      
      if (idempotencyRecord) {
        if (idempotencyRecord.requestHash !== requestHash) {
          throw new AppError({ code: 'CONFLICT', statusCode: 409, message: 'Idempotency key already used with different payload' });
        }
        if (idempotencyRecord.state === 'completed') {
          const plant = await MyPlant.findById(idempotencyRecord.resultReference);
          if (plant) {
            const result = {
              plant: {
                id: plant._id,
                _id: plant._id,
                name: plant.name,
                species: plant.species,
                scientificName: plant.scientificName,
                imageUrl: plant.imageUrl,
                location: plant.location,
                garden: plant.garden,
                zone: plant.zone,
                room: plant.room,
                notes: plant.notes,
                waterFrequencyDays: plant.waterFrequencyDays,
                lastWatered: plant.lastWatered,
                nextWaterInDays: calculateNextWaterInDays(plant.lastWatered, plant.waterFrequencyDays),
                plantLibraryId: plant.plantLibraryId,
                confidenceScore: plant.confidenceScore,
                aiVerified: plant.aiVerified,
                userApproved: plant.userApproved,
                enableNotifications: plant.enableNotifications,
                healthStatus: plant.healthStatus,
                createdAt: plant.createdAt,
              }
            };
            return created(res, result, result);
          }
        }
        if (idempotencyRecord.state === 'started') {
          throw new AppError({ code: 'CONFLICT', statusCode: 409, message: 'Request is already in progress' });
        }
      } else {
        idempotencyRecord = await IdempotencyRecord.create({
          actor: userId,
          scope: 'my-plants:add',
          key: idempotencyKey,
          requestHash,
          state: 'started',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        });
      }
    }

    const plant = await MyPlant.create({
      user: userId,
      garden: gardenId || undefined,
      zone: zoneId || undefined,
      name: name.trim(),
      species: species.trim(),
      scientificName: scientificName?.trim(),
      imageUrl: imageUrl || "",
      location,
      room,
      notes,
      waterFrequencyDays: Number(waterFrequencyDays),
      lastWatered: lastWatered ? new Date(lastWatered) : undefined,
      plantLibraryId: plantLibraryId || undefined,
      confidenceScore,
      aiVerified,
      userApproved,
      enableNotifications: enableNotifications !== undefined ? enableNotifications : true,
      healthStatus: healthStatus || "excellent",
    });

    const { TaskService } = require('../services/TaskService');
    const taskService = new TaskService();

    // Helper to parse frequency string like "Every 2 weeks" to days
    const parseFrequencyDays = (freqStr: string, defaultDays: number): number => {
      if (!freqStr) return defaultDays;
      const str = freqStr.toLowerCase();
      if (str.includes('week')) return (parseInt(str.match(/\d+/)?.toString() || '1') * 7) || defaultDays;
      if (str.includes('month')) return (parseInt(str.match(/\d+/)?.toString() || '1') * 30) || defaultDays;
      if (str.includes('day')) return parseInt(str.match(/\d+/)?.toString() || '1') || defaultDays;
      return defaultDays;
    };

    if (plant.enableNotifications) {
      const nextDate = new Date(plant.lastWatered.getTime() + plant.waterFrequencyDays * 24 * 60 * 60 * 1000);
      
      await taskService.createTask(userId, `Water ${plant.name}`, nextDate, plant._id.toString());
      await Reminder.create({
        user: userId,
        plantId: plant._id,
        title: `Water ${plant.name}`,
        timeLabel: 'Auto',
        scheduledAt: nextDate,
        enabled: true,
      });
      
      // Auto-generate other tasks if libraryProfile exists
      if (libraryProfile) {
        if (libraryProfile.fertilizerRequirements) {
          const fertDays = parseFrequencyDays(libraryProfile.fertilizerRequirements, 30);
          const nextFertDate = new Date(Date.now() + fertDays * 24 * 60 * 60 * 1000);
          await taskService.createTask(userId, `Fertilize ${plant.name}`, nextFertDate, plant._id.toString());
          await Reminder.create({
            user: userId, plantId: plant._id, title: `Fertilize ${plant.name}`, timeLabel: 'Auto', scheduledAt: nextFertDate, enabled: true
          });
        }
        
        if (libraryProfile.pruningFrequency) {
          const pruneDays = parseFrequencyDays(libraryProfile.pruningFrequency, 90);
          const nextPruneDate = new Date(Date.now() + pruneDays * 24 * 60 * 60 * 1000);
          await taskService.createTask(userId, `Prune ${plant.name}`, nextPruneDate, plant._id.toString());
          await Reminder.create({
            user: userId, plantId: plant._id, title: `Prune ${plant.name}`, timeLabel: 'Auto', scheduledAt: nextPruneDate, enabled: true
          });
        }
        
        if (libraryProfile.harvestTime) {
          const harvestDays = parseFrequencyDays(libraryProfile.harvestTime, 120);
          const nextHarvestDate = new Date(Date.now() + harvestDays * 24 * 60 * 60 * 1000);
          await taskService.createTask(userId, `Harvest ${plant.name}`, nextHarvestDate, plant._id.toString());
          await Reminder.create({
            user: userId, plantId: plant._id, title: `Harvest ${plant.name}`, timeLabel: 'Auto', scheduledAt: nextHarvestDate, enabled: true
          });
        }
      }
    }

    const result = {
      plant: {
        id: plant._id,
        _id: plant._id,
        name: plant.name,
        species: plant.species,
        scientificName: plant.scientificName,
        imageUrl: plant.imageUrl,
        location: plant.location,
        garden: plant.garden,
        zone: plant.zone,
        room: plant.room,
        notes: plant.notes,
        waterFrequencyDays: plant.waterFrequencyDays,
        lastWatered: plant.lastWatered,
        nextWaterInDays: calculateNextWaterInDays(plant.lastWatered, plant.waterFrequencyDays),
        plantLibraryId: plant.plantLibraryId,
        confidenceScore: plant.confidenceScore,
        aiVerified: plant.aiVerified,
        userApproved: plant.userApproved,
        enableNotifications: plant.enableNotifications,
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

    return created(res, result, result);
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      next(new AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error.message }));
    } else {
      next(error);
    }
  }
};

// @desc    Update a plant
// @route   PUT /api/my-plants/:id
// @access  Private
export const updatePlant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { name, species, imageUrl, location, waterFrequencyDays, lastWatered, healthStatus, plantLibraryId, enableNotifications, notes, confidenceScore, aiVerified, userApproved } = req.body;

    if (waterFrequencyDays !== undefined && Number(waterFrequencyDays) < 1) {
      return res.status(400).json({ success: false, message: "waterFrequencyDays must be at least 1" });
    }

    const plant = await MyPlant.findOne({ _id: req.params.id, user: userId });
    if (!plant) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
    }

    if (name !== undefined) plant.name = name.trim();
    if (species !== undefined) plant.species = species.trim();
    if (imageUrl !== undefined && imageUrl !== plant.imageUrl) {
      if (plant.imageUrl) {
        await deleteCloudinaryImage(plant.imageUrl);
      }
      plant.imageUrl = imageUrl;
    }
    if (location !== undefined) plant.location = location;
    if (waterFrequencyDays !== undefined) plant.waterFrequencyDays = Number(waterFrequencyDays);
    if (lastWatered !== undefined) plant.lastWatered = new Date(lastWatered);
    if (healthStatus !== undefined) plant.healthStatus = healthStatus;
    if (plantLibraryId !== undefined) plant.plantLibraryId = plantLibraryId;
    
    if (notes !== undefined) plant.notes = notes;
    if (confidenceScore !== undefined) plant.confidenceScore = confidenceScore;
    if (aiVerified !== undefined) plant.aiVerified = aiVerified;
    if (userApproved !== undefined) plant.userApproved = userApproved;
    
    const oldEnableNotifications = plant.enableNotifications;
    if (enableNotifications !== undefined) plant.enableNotifications = enableNotifications;

    await plant.save();

    if (enableNotifications !== undefined || waterFrequencyDays !== undefined || lastWatered !== undefined) {
      if (!plant.enableNotifications) {
        await Reminder.deleteMany({ plantId: plant._id });
      } else {
        const nextDate = new Date(plant.lastWatered.getTime() + plant.waterFrequencyDays * 24 * 60 * 60 * 1000);
        const existingReminder = await Reminder.findOne({ plantId: plant._id });
        
        if (existingReminder) {
          existingReminder.scheduledAt = nextDate;
          existingReminder.title = `Water ${plant.name}`;
          await existingReminder.save();
        } else {
          await Reminder.create({
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

    return ok(res, {
      plant: {
        id: plant._id,
        _id: plant._id,
        name: plant.name,
        species: plant.species,
        imageUrl: plant.imageUrl,
        location: plant.location,
        garden: plant.garden,
        zone: plant.zone,
        room: plant.room,
        notes: plant.notes,
        waterFrequencyDays: plant.waterFrequencyDays,
        lastWatered: plant.lastWatered,
        nextWaterInDays: calculateNextWaterInDays(plant.lastWatered, plant.waterFrequencyDays),
        healthStatus: plant.healthStatus,
        confidenceScore: plant.confidenceScore,
        aiVerified: plant.aiVerified,
        userApproved: plant.userApproved,
        createdAt: plant.createdAt,
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      next(new AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error.message }));
    } else {
      next(error);
    }
  }
};

export const deleteCloudinaryImage = async (imageUrl: string) => {
  if (!imageUrl || !imageUrl.includes('cloudinary.com')) return;
  try {
    const urlParts = imageUrl.split('/');
    // e.g. https://res.cloudinary.com/cloud/image/upload/v12345/folder/image.jpg
    // or   https://res.cloudinary.com/cloud/image/upload/folder/image.jpg
    const uploadIndex = urlParts.indexOf('upload');
    if (uploadIndex === -1) return;

    // Skip optional version segment (starts with 'v' followed by digits)
    let startIndex = uploadIndex + 1;
    if (urlParts[startIndex] && /^v\d+$/.test(urlParts[startIndex])) {
      startIndex += 1;
    }

    // Everything from startIndex onward is the public_id minus file extension
    const pathAfterUpload = urlParts.slice(startIndex).join('/');
    const publicId = pathAfterUpload.replace(/\.[^/.]+$/, ''); // remove extension

    if (publicId) {
      await cloudinary.uploader.destroy(publicId);
    }
  } catch (err) {
    console.error('Failed to delete image from Cloudinary:', err);
  }
};

// @desc    Delete a plant
// @route   DELETE /api/my-plants/:id
// @access  Private
export const deletePlant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const plant = await MyPlant.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!plant) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found or unauthorized' });
    }

    if (plant.imageUrl) {
      await deleteCloudinaryImage(plant.imageUrl);
    }

    await Promise.all([
      WateringLog.deleteMany({ plant: plant._id }),
      DiaryEntry.deleteMany({ plantId: plant._id }),
      Reminder.deleteMany({ plantId: plant._id }),
      DiagnosisHistory.deleteMany({ plantId: plant._id }),
      FertilizerLog.deleteMany({ plant: plant._id }),
    ]);

    return ok(res, {
      message: "Plant deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Log plant watering
// @route   POST /api/my-plants/:id/water
// @access  Private
export const waterPlant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { wateredAt, note } = req.body;

    const plant = await MyPlant.findOne({ _id: req.params.id, user: userId });
    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }

    const wateredDate = wateredAt ? new Date(wateredAt) : new Date();
    plant.lastWatered = wateredDate;
    await plant.save();

    const log = await WateringLog.create({
      plant: plant._id,
      user: userId,
      wateredAt: wateredDate,
      note: note?.trim(),
    });

    return ok(res, {
      message: "Watering logged successfully",
      lastWatered: plant.lastWatered,
      log: { id: log._id, wateredAt: log.wateredAt, note: log.note },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get watering logs for a plant
// @route   GET /api/my-plants/:id/water-logs
// @access  Private
export const getWateringLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const plant = await MyPlant.findOne({ _id: req.params.id, user: userId });
    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    const logs = await WateringLog.find({ plant: req.params.id, user: userId })
      .sort({ wateredAt: -1 })
      .limit(50);

    return ok(res, {
      count: logs.length,
      logs: logs.map(l => ({ id: l._id, wateredAt: l.wateredAt, note: l.note })),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Upload plant image to Cloudinary
// @route   POST /api/my-plants/:id/image
// @access  Private
export const uploadPlantImage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }

    const plant = await MyPlant.findOne({ _id: req.params.id, user: userId });
    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    const imageUrl = await new Promise<string>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'nabatech/my_plants', resource_type: 'image' },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!.secure_url);
        }
      );
      stream.end(req.file!.buffer);
    });

    if (plant.imageUrl) {
      await deleteCloudinaryImage(plant.imageUrl);
    }
    plant.imageUrl = imageUrl;
    await plant.save();

    return ok(res, {
      imageUrl,
      plant: { id: plant._id, imageUrl: plant.imageUrl }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard analytics for a plant
// @route   GET /api/my-plants/:id/dashboard
// @access  Private
export const getPlantDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const plantId = req.params.id;

    const plant = await MyPlant.findOne({ _id: plantId, user: userId });
    if (!plant) {
      return res.status(404).json({ success: false, message: "Plant not found" });
    }

    const [waterings, diaries, diagnoses, reminders] = await Promise.all([
      WateringLog.countDocuments({ plant: plantId }),
      DiaryEntry.countDocuments({ plantId: plantId }),
      DiagnosisHistory.countDocuments({ plantId: plantId }),
      Reminder.countDocuments({ plantId: plantId }),
    ]);

    const daysAlive = Math.floor((Date.now() - new Date(plant.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    return ok(res, {
      totalWaterings: waterings,
      totalDiaries: diaries,
      totalDiagnoses: diagnoses,
      totalReminders: reminders,
      daysAlive: daysAlive >= 0 ? daysAlive : 0,
      healthStatus: plant.healthStatus,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get diaries for a plant
// @route   GET /api/my-plants/:id/diaries
// @access  Private
export const getPlantDiaries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const plantId = req.params.id;

    const plant = await MyPlant.findOne({ _id: plantId, user: userId });
    if (!plant) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
    }

    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 10;
    const skip = (page - 1) * limit;

    const diaries = await DiaryEntry.find({ plantId, user: userId })
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit)
      .select('_id title notes date moodCode healthScore')
      .lean();

    const count = await DiaryEntry.countDocuments({ plantId, user: userId });

    const formattedDiaries = diaries.map((diary: any) => {
      const { _id, ...rest } = diary;
      return { id: _id, ...rest };
    });

    return ok(res, {
      count,
      diaries: formattedDiaries,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get reminders for a plant
// @route   GET /api/my-plants/:id/reminders
// @access  Private
export const getPlantReminders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const plantId = req.params.id;

    const plant = await MyPlant.findOne({ _id: plantId, user: userId });
    if (!plant) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
    }

    const reminders = await Reminder.find({ plantId, user: userId })
      .select('_id title scheduledAt recurrence enabled iconCodePoint')
      .lean();

    const formattedReminders = reminders.map((reminder: any) => {
      const { _id, ...rest } = reminder;
      return { id: _id, plantName: plant.name, ...rest };
    });

    return ok(res, {
      count: formattedReminders.length,
      reminders: formattedReminders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get diagnoses for a plant
// @route   GET /api/my-plants/:id/diagnoses
// @access  Private
export const getPlantDiagnoses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const plantId = req.params.id;

    const plant = await MyPlant.findOne({ _id: plantId, user: userId });
    if (!plant) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
    }

    const diagnoses = await DiagnosisHistory.find({ plantId, user: userId })
      .sort({ diagnosedAt: -1 })
      .limit(10)
      .select('_id imageUrl diseaseNameEn diseaseNameAr confidence severity diagnosedAt')
      .lean();

    const formattedDiagnoses = diagnoses.map((diagnosis: any) => {
      const { _id, ...rest } = diagnosis;
      return { id: _id, ...rest };
    });

    return ok(res, {
      count: formattedDiagnoses.length,
      diagnoses: formattedDiagnoses,
    });
  } catch (error) {
    next(error);
  }
};

const normalizeFertilizerType = (type: string): string => {
  const upper = type.toUpperCase();
  const mapping: Record<string, string> = {
    'SLOW-RELEASE': 'SLOW_RELEASE',
  };
  return mapping[upper] ?? upper;
};

// @desc    Log plant fertilization
// @route   POST /api/my-plants/:id/fertilize
// @access  Private
export const fertilizePlant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const plantId = req.params.id;
    let { fertilizedAt, fertilizerType, amountGrams, note, clientOperationId } = req.body;
    fertilizerType = normalizeFertilizerType(fertilizerType);

    const plant = await MyPlant.findOne({ _id: plantId, user: userId });
    if (!plant) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
    }

    if (clientOperationId) {
      const existingLog = await FertilizerLog.findOne({ clientOperationId, user: userId });
      if (existingLog) {
        return ok(res, {
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

    const log = await FertilizerLog.create({
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

    return created(res, {
      message: "Fertilization logged successfully",
      log: {
        id: log._id,
        fertilizedAt: log.fertilizedAt,
        fertilizerType: log.fertilizerType,
        amountGrams: log.amountGrams,
        note: log.note,
      }
    });
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      next(new AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error.message }));
    } else {
      next(error);
    }
  }
};

// @desc    Get fertilizer logs for a plant
// @route   GET /api/my-plants/:id/fertilizer-logs
// @access  Private
export const getFertilizerLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const plantId = req.params.id;

    const plant = await MyPlant.findOne({ _id: plantId, user: userId });
    if (!plant) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
    }

    const logs = await FertilizerLog.find({ plant: plantId, user: userId })
      .sort({ fertilizedAt: -1 })
      .lean();

    return ok(res, {
      count: logs.length,
      logs: logs.map((log: any) => {
        const { _id, ...rest } = log;
        return { id: _id, ...rest };
      })
    });
  } catch (error) {
    next(error);
  }
};



