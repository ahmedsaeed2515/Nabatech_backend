import { Request, Response } from "express";
import LightMeterSession from "../models/light_meter_session_model";
import WateringCalculation from "../models/watering_calculation_model";
import HomeWidget from "../models/home_widget_model";
import HomeBanner from "../models/home_banner_model";
import HomeQuickAction from "../models/home_quick_action_model";
import HomeSection from "../models/home_section_model";
import HomeAnalytics from "../models/home_analytics_model";
import { getAiSettings } from "../services/ai/ai_config_service";
import { askLlm } from "../services/ai/llm_provider";

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

// ---------- Light Meter ----------
export const getLightMeterHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { cursor, limit } = req.query as any;
    const pageSize = Math.min(parseInt(limit) || 20, 50);
    const query: any = { user: userId };
    if (cursor) query._id = { $lt: cursor };
    const items = await LightMeterSession.find(query).sort({ _id: -1 }).limit(pageSize + 1);
    const hasNext = items.length > pageSize;
    const results = hasNext ? items.slice(0, pageSize) : items;
    const nextCursor = hasNext ? results[results.length - 1]._id : null;
    return res.status(200).json({
      success: true,
      data: {
        items: results.map(toLightPayload),
        pageInfo: { nextCursor, limit: pageSize },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch light meter history" });
  }
};

export const createLightMeterHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plantId, plantLibraryId, lux, zone, clientOperationId, source } = req.body;
    if (lux === undefined || !zone) {
      return res.status(400).json({ success: false, message: "lux and zone are required" });
    }
    const created = await LightMeterSession.create({
      user: userId,
      plantId: plantId ? String(plantId).trim() : undefined,
      plantLibraryId: plantLibraryId ? plantLibraryId : undefined,
      lux: Number(lux),
      zone: String(zone).trim(),
      clientOperationId: clientOperationId ? String(clientOperationId).trim() : undefined,
      source: source ?? "local",
    }).catch((err) => {
      if (err.code === 11000) throw { status: 409, code: "CONFLICT", message: "Duplicate operation" };
      throw err;
    });
    return res.status(201).json({ success: true, data: toLightPayload(created) });
  } catch (error: any) {
    if (error.status === 409) return res.status(409).json({ success: false, code: "CONFLICT", message: error.message });
    return res.status(500).json({ success: false, message: "Failed to save light meter reading" });
  }
};

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
    return res.status(200).json({ success: true, data: { plantId, recommendedLux } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get light recommendation" });
  }
};

// ---------- Watering ----------
export const getWateringHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { cursor, limit } = req.query as any;
    const pageSize = Math.min(parseInt(limit) || 20, 50);
    const query: any = { user: userId };
    if (cursor) query._id = { $lt: cursor };
    const items = await WateringCalculation.find(query).sort({ _id: -1 }).limit(pageSize + 1);
    const hasNext = items.length > pageSize;
    const results = hasNext ? items.slice(0, pageSize) : items;
    const nextCursor = hasNext ? results[results.length - 1]._id : null;
    return res.status(200).json({
      success: true,
      data: {
        items: results.map(toWaterPayload),
        pageInfo: { nextCursor, limit: pageSize },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch watering history" });
  }
};

export const createWateringHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plantType, plantLibraryId, potSize, season, location, days, volumeMl, clientOperationId, source } = req.body;
    if (!potSize || !season || !location || days === undefined || volumeMl === undefined) {
      return res.status(400).json({
        success: false,
        message: "potSize, season, location, days and volumeMl are required",
      });
    }
    const created = await WateringCalculation.create({
      user: userId,
      plantType: plantType ? String(plantType).trim() : undefined,
      plantLibraryId: plantLibraryId ? plantLibraryId : undefined,
      potSize: String(potSize).trim(),
      season: String(season).trim(),
      location: String(location).trim(),
      days: Number(days),
      volumeMl: Number(volumeMl),
      clientOperationId: clientOperationId ? String(clientOperationId).trim() : undefined,
      source: source ?? "local",
    }).catch((err) => {
      if (err.code === 11000) throw { status: 409, code: "CONFLICT", message: "Duplicate operation" };
      throw err;
    });
    return res.status(201).json({ success: true, data: toWaterPayload(created) });
  } catch (error: any) {
    if (error.status === 409) return res.status(409).json({ success: false, code: "CONFLICT", message: error.message });
    return res.status(500).json({ success: false, message: "Failed to save watering calculation" });
  }
};

export const getWateringRecommendation = async (req: Request, res: Response) => {
  try {
    const { plantType, potSize, season, location } = req.query as any;
    const baseDays = String(plantType || "").toLowerCase().includes("succulent") ? 10 : 5;
    const seasonDelta = String(season || "").toLowerCase() === "summer" ? -1 : 1;
    const locationDelta = String(location || "").toLowerCase() === "outdoor" ? -1 : 0;
    const potDelta = String(potSize || "").toLowerCase() === "large" ? 2 : 0;
    const days = Math.max(1, baseDays + seasonDelta + locationDelta + potDelta);
    const volumeMl = String(potSize || "").toLowerCase() === "small" ? 220 : 350;
    return res.status(200).json({ success: true, data: { days, volumeMl } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to get watering recommendation" });
  }
};

export const getWateringSchedule = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const plants = await require('../models/my_plant_model').default.find({ user: userId }).lean();
    
    const schedule = plants.map((p: any) => {
      const lastWatered = p.lastWatered ? new Date(p.lastWatered) : new Date(p.createdAt);
      const nextWateringDate = new Date(lastWatered.getTime() + (p.waterFrequencyDays || 7) * 24 * 60 * 60 * 1000);
      return {
        plantId: p._id,
        plantName: p.name,
        imageUrl: p.imageUrl,
        lastWatered: lastWatered,
        waterFrequencyDays: p.waterFrequencyDays || 7,
        nextWateringDate: nextWateringDate
      };
    });

    schedule.sort((a: any, b: any) => a.nextWateringDate.getTime() - b.nextWateringDate.getTime());

    return res.status(200).json({ success: true, data: { items: schedule } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch watering schedule" });
  }
};

// ---------- Admin Analytics ----------
export const getHomeToolsAnalytics = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (user.role !== "admin" && user.role !== "super_admin") {
      return res.status(403).json({ success: false, code: "AUTH_FORBIDDEN", message: "Admin access required" });
    }
    const { from, to, timeZone } = req.query as any;
    const match: any = {};
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from);
      if (to) match.createdAt.$lte = new Date(to);
    }
    const [lightRes, wateringRes] = await Promise.all([
      LightMeterSession.aggregate([ { $match: match }, { $group: { _id: null, count: { $sum: 1 } } } ]),
      WateringCalculation.aggregate([ { $match: match }, { $group: { _id: null, count: { $sum: 1 } } } ]),
    ]);
    const byDay = await LightMeterSession.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: timeZone || "UTC" } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    return res.status(200).json({
      success: true,
      data: {
        light: lightRes[0]?.count || 0,
        watering: wateringRes[0]?.count || 0,
        byDay,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to fetch admin analytics" });
  }
};

// ---------- Feed Orchestrator ----------
export const getHomeFeed = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || "anonymous";
    const now = new Date();

    const [widgets, banners, actions, sections] = await Promise.all([
      HomeWidget.find({ isActive: true }).sort({ defaultOrder: 1 }),
      HomeBanner.find({
        isActive: true,
        $and: [
          { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
          { $or: [{ endDate: null }, { endDate: { $gte: now } }] }
        ]
      }).sort({ priority: -1 }),
      HomeQuickAction.find({ isActive: true }).sort({ order: 1 }),
      HomeSection.find({ isActive: true }).sort({ order: 1 })
    ]);

    // AI Daily Tip (Mock integration, actual AI Orchestrator can be called here)
    let aiTip = null;
    if (userId !== "anonymous") {
      try {
        const settings = await getAiSettings();
        const prompt = `Generate a single short (max 2 sentences) garden tip or fact.`;
        const llmResult = await askLlm(settings, prompt, "llm", [], "search");
        aiTip = { title: "Daily Tip", message: llmResult.message };
      } catch (e) {
        // Fallback
        aiTip = { title: "Daily Tip", message: "Watering early morning prevents evaporation and fungal disease." };
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        banners: banners.map(b => ({ id: b._id, title: b.title, imageUrl: b.imageUrl, targetUrl: b.targetUrl })),
        quickActions: actions.map(a => ({ id: a._id, label: a.label, iconName: a.iconName, deeplink: a.deeplink })),
        widgets: widgets.map(w => ({ id: w._id, widgetId: w.widgetId, title: w.title, description: w.description })),
        sections: sections.map(s => ({ id: s._id, sectionId: s.sectionId, title: s.title, type: s.type })),
        aiTip
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load home feed" });
  }
};

export const trackHomeEvent = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const { eventType, entityType, entityId } = req.body;
    
    if (!eventType || !entityType || !entityId) {
      return res.status(400).json({ success: false, message: "Missing tracking data" });
    }

    await HomeAnalytics.create({
      userId: userId ? userId : undefined,
      eventType,
      entityType,
      entityId
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to track event" });
  }
};


