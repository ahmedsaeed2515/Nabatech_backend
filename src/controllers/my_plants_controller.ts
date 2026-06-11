import { Request, Response, NextFunction } from "express";
import MyPlant from "../models/my_plant_model";
import WateringLog from "../models/watering_log_model";
import cloudinary from "../config/cloudinary";
import IdempotencyRecord from "../models/idempotency_record_model";
import crypto from "crypto";
import { AppError } from "../utils/app_error";
import { ok, created } from "../utils/api_response";

// @desc    Get all plants of the user
// @route   GET /api/my-plants
// @access  Private
export const getMyPlants = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await MyPlant.countDocuments({ user: userId });
    const plants = await MyPlant.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return ok(res, {
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
    next(error);
  }
};

// @desc    Add a new plant
// @route   POST /api/my-plants
// @access  Private
export const addPlant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.id;
    const { name, species, imageUrl, location, waterFrequencyDays, lastWatered, healthStatus } = req.body;

    if (!name || !species || !location || waterFrequencyDays === undefined) {
      throw new AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: 'Name, species, location and water frequency are required' });
    }

    if (waterFrequencyDays !== undefined && Number(waterFrequencyDays) < 1) {
      throw new AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: 'waterFrequencyDays must be at least 1' });
    }

    const idempotencyKey = req.headers['idempotency-key'] as string;
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
      name: name.trim(),
      species: species.trim(),
      imageUrl: imageUrl || "",
      location,
      waterFrequencyDays: Number(waterFrequencyDays),
      lastWatered: lastWatered ? new Date(lastWatered) : undefined,
      healthStatus: healthStatus || "excellent",
    });

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
    const { name, species, imageUrl, location, waterFrequencyDays, lastWatered, healthStatus } = req.body;

    if (waterFrequencyDays !== undefined && Number(waterFrequencyDays) < 1) {
      return res.status(400).json({ success: false, message: "waterFrequencyDays must be at least 1" });
    }

    const plant = await MyPlant.findOne({ _id: req.params.id, user: userId });
    if (!plant) {
      throw new AppError({ code: 'RESOURCE_NOT_FOUND', statusCode: 404, message: 'Plant not found' });
    }

    if (name !== undefined) plant.name = name.trim();
    if (species !== undefined) plant.species = species.trim();
    if (imageUrl !== undefined) plant.imageUrl = imageUrl;
    if (location !== undefined) plant.location = location;
    if (waterFrequencyDays !== undefined) plant.waterFrequencyDays = Number(waterFrequencyDays);
    if (lastWatered !== undefined) plant.lastWatered = new Date(lastWatered);
    if (healthStatus !== undefined) plant.healthStatus = healthStatus;

    await plant.save();

    return ok(res, {
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
  } catch (error: any) {
    if (error.name === 'ValidationError') {
      next(new AppError({ code: 'VALIDATION_FAILED', statusCode: 400, message: error.message }));
    } else {
      next(error);
    }
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
        { folder: "my_plants" },
        (error, result) => {
          if (error) return reject(error);
          resolve(result!.secure_url);
        }
      );
      stream.end(req.file!.buffer);
    });

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
