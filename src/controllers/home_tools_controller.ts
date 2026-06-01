import { Request, Response } from "express";
import LightMeterSession from "../models/light_meter_session_model";
import WateringCalculation from "../models/watering_calculation_model";

const toLightPayload = (item: any) => ({
  id: item._id,
  plantId: item.plantId || null,
  lux: item.lux,
  zone: item.zone,
  createdAt: item.createdAt,
});

const toWaterPayload = (item: any) => ({
  id: item._id,
  plantType: item.plantType || null,
  potSize: item.potSize,
  season: item.season,
  location: item.location,
  days: item.days,
  volumeMl: item.volumeMl,
  createdAt: item.createdAt,
});

// @desc    Get light meter history
// @route   GET /api/home-tools/light-meter/history
// @access  Private
export const getLightMeterHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const history = await LightMeterSession.find({ user: userId }).sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ success: true, data: history.map((item) => toLightPayload(item)) });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch light meter history" });
  }
};

// @desc    Save light meter reading
// @route   POST /api/home-tools/light-meter/history
// @access  Private
export const createLightMeterHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plantId, lux, zone } = req.body;

    if (lux === undefined || !zone) {
      return res
        .status(400)
        .json({ success: false, message: "lux and zone are required" });
    }

    const created = await LightMeterSession.create({
      user: userId,
      plantId: plantId ? String(plantId).trim() : undefined,
      lux: Number(lux),
      zone: String(zone).trim(),
    });

    return res.status(201).json({ success: true, data: toLightPayload(created) });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to save light meter reading" });
  }
};

// @desc    Get light recommendation
// @route   GET /api/home-tools/light-meter/recommendations/:plantId
// @access  Private
export const getLightRecommendation = async (req: Request, res: Response) => {
  try {
    const plantId = String(req.params.plantId || "").trim().toLowerCase();
    const recommendationMap: Record<string, number> = {
      aloe: 1400,
      sunflower: 2400,
      pothos: 700,
      snake_plant: 450,
      monstera: 900,
    };

    const recommendedLux = recommendationMap[plantId] ?? 900;
    return res.status(200).json({
      success: true,
      data: { plantId, recommendedLux },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to get light recommendation" });
  }
};

// @desc    Get watering calculation history
// @route   GET /api/home-tools/watering/history
// @access  Private
export const getWateringHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const history = await WateringCalculation.find({ user: userId }).sort({ createdAt: -1 });
    return res
      .status(200)
      .json({ success: true, data: history.map((item) => toWaterPayload(item)) });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch watering history" });
  }
};

// @desc    Save watering calculation
// @route   POST /api/home-tools/watering/history
// @access  Private
export const createWateringHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plantType, potSize, season, location, days, volumeMl } = req.body;

    if (!potSize || !season || !location || days === undefined || volumeMl === undefined) {
      return res.status(400).json({
        success: false,
        message: "potSize, season, location, days and volumeMl are required",
      });
    }

    const created = await WateringCalculation.create({
      user: userId,
      plantType: plantType ? String(plantType).trim() : undefined,
      potSize: String(potSize).trim(),
      season: String(season).trim(),
      location: String(location).trim(),
      days: Number(days),
      volumeMl: Number(volumeMl),
    });

    return res.status(201).json({ success: true, data: toWaterPayload(created) });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to save watering calculation" });
  }
};

// @desc    Get watering recommendation
// @route   GET /api/home-tools/watering/recommendations
// @access  Private
export const getWateringRecommendation = async (req: Request, res: Response) => {
  try {
    const { plantType, potSize, season, location } = req.query;

    const baseDays =
      String(plantType || "").toLowerCase().includes("succulent") ? 10 : 5;
    const seasonDelta = String(season || "").toLowerCase() === "summer" ? -1 : 1;
    const locationDelta = String(location || "").toLowerCase() === "outdoor" ? -1 : 0;
    const potDelta = String(potSize || "").toLowerCase() === "large" ? 2 : 0;

    const days = Math.max(1, baseDays + seasonDelta + locationDelta + potDelta);
    const volumeMl = String(potSize || "").toLowerCase() === "small" ? 220 : 350;

    return res.status(200).json({
      success: true,
      data: {
        days,
        volumeMl,
      },
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to get watering recommendation" });
  }
};

