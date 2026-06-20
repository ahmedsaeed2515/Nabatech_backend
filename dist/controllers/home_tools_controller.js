"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.trackHomeEvent = exports.getHomeFeed = exports.getHomeToolsAnalytics = exports.getWateringRecommendation = exports.createWateringHistory = exports.getWateringHistory = exports.getLightRecommendation = exports.createLightMeterHistory = exports.getLightMeterHistory = void 0;
const light_meter_session_model_1 = __importDefault(require("../models/light_meter_session_model"));
const watering_calculation_model_1 = __importDefault(require("../models/watering_calculation_model"));
const home_widget_model_1 = __importDefault(require("../models/home_widget_model"));
const home_banner_model_1 = __importDefault(require("../models/home_banner_model"));
const home_quick_action_model_1 = __importDefault(require("../models/home_quick_action_model"));
const home_section_model_1 = __importDefault(require("../models/home_section_model"));
const home_analytics_model_1 = __importDefault(require("../models/home_analytics_model"));
const ai_config_service_1 = require("../services/ai/ai_config_service");
const llm_provider_1 = require("../services/ai/llm_provider");
const toLightPayload = (item) => ({
    id: item._id,
    plantId: item.plantId || null,
    lux: item.lux,
    zone: item.zone,
    createdAt: item.createdAt,
});
const toWaterPayload = (item) => ({
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
const getLightMeterHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cursor, limit } = req.query;
        const pageSize = Math.min(parseInt(limit) || 20, 50);
        const query = { user: userId };
        if (cursor)
            query._id = { $lt: cursor };
        const items = await light_meter_session_model_1.default.find(query).sort({ _id: -1 }).limit(pageSize + 1);
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch light meter history" });
    }
};
exports.getLightMeterHistory = getLightMeterHistory;
const createLightMeterHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { plantId, plantLibraryId, lux, zone, clientOperationId, source } = req.body;
        if (lux === undefined || !zone) {
            return res.status(400).json({ success: false, message: "lux and zone are required" });
        }
        const created = await light_meter_session_model_1.default.create({
            user: userId,
            plantId: plantId ? String(plantId).trim() : undefined,
            plantLibraryId: plantLibraryId ? plantLibraryId : undefined,
            lux: Number(lux),
            zone: String(zone).trim(),
            clientOperationId: clientOperationId ? String(clientOperationId).trim() : undefined,
            source: source ?? "local",
        }).catch((err) => {
            if (err.code === 11000)
                throw { status: 409, code: "CONFLICT", message: "Duplicate operation" };
            throw err;
        });
        return res.status(201).json({ success: true, data: toLightPayload(created) });
    }
    catch (error) {
        if (error.status === 409)
            return res.status(409).json({ success: false, code: "CONFLICT", message: error.message });
        return res.status(500).json({ success: false, message: "Failed to save light meter reading" });
    }
};
exports.createLightMeterHistory = createLightMeterHistory;
const getLightRecommendation = async (req, res) => {
    try {
        const plantId = String(req.params.plantId || "").trim().toLowerCase();
        const recommendationMap = {
            aloe: 1400,
            sunflower: 2400,
            pothos: 700,
            snake_plant: 450,
            monstera: 900,
        };
        const recommendedLux = recommendationMap[plantId] ?? 900;
        return res.status(200).json({ success: true, data: { plantId, recommendedLux } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Failed to get light recommendation" });
    }
};
exports.getLightRecommendation = getLightRecommendation;
// ---------- Watering ----------
const getWateringHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { cursor, limit } = req.query;
        const pageSize = Math.min(parseInt(limit) || 20, 50);
        const query = { user: userId };
        if (cursor)
            query._id = { $lt: cursor };
        const items = await watering_calculation_model_1.default.find(query).sort({ _id: -1 }).limit(pageSize + 1);
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch watering history" });
    }
};
exports.getWateringHistory = getWateringHistory;
const createWateringHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { plantType, plantLibraryId, potSize, season, location, days, volumeMl, clientOperationId, source } = req.body;
        if (!potSize || !season || !location || days === undefined || volumeMl === undefined) {
            return res.status(400).json({
                success: false,
                message: "potSize, season, location, days and volumeMl are required",
            });
        }
        const created = await watering_calculation_model_1.default.create({
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
            if (err.code === 11000)
                throw { status: 409, code: "CONFLICT", message: "Duplicate operation" };
            throw err;
        });
        return res.status(201).json({ success: true, data: toWaterPayload(created) });
    }
    catch (error) {
        if (error.status === 409)
            return res.status(409).json({ success: false, code: "CONFLICT", message: error.message });
        return res.status(500).json({ success: false, message: "Failed to save watering calculation" });
    }
};
exports.createWateringHistory = createWateringHistory;
const getWateringRecommendation = async (req, res) => {
    try {
        const { plantType, potSize, season, location } = req.query;
        const baseDays = String(plantType || "").toLowerCase().includes("succulent") ? 10 : 5;
        const seasonDelta = String(season || "").toLowerCase() === "summer" ? -1 : 1;
        const locationDelta = String(location || "").toLowerCase() === "outdoor" ? -1 : 0;
        const potDelta = String(potSize || "").toLowerCase() === "large" ? 2 : 0;
        const days = Math.max(1, baseDays + seasonDelta + locationDelta + potDelta);
        const volumeMl = String(potSize || "").toLowerCase() === "small" ? 220 : 350;
        return res.status(200).json({ success: true, data: { days, volumeMl } });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Failed to get watering recommendation" });
    }
};
exports.getWateringRecommendation = getWateringRecommendation;
// ---------- Admin Analytics ----------
const getHomeToolsAnalytics = async (req, res) => {
    try {
        const user = req.user;
        if (user.role !== "admin") {
            return res.status(403).json({ success: false, code: "AUTH_FORBIDDEN", message: "Admin access required" });
        }
        const { from, to, timeZone } = req.query;
        const match = {};
        if (from || to) {
            match.createdAt = {};
            if (from)
                match.createdAt.$gte = new Date(from);
            if (to)
                match.createdAt.$lte = new Date(to);
        }
        const [lightRes, wateringRes] = await Promise.all([
            light_meter_session_model_1.default.aggregate([{ $match: match }, { $group: { _id: null, count: { $sum: 1 } } }]),
            watering_calculation_model_1.default.aggregate([{ $match: match }, { $group: { _id: null, count: { $sum: 1 } } }]),
        ]);
        const byDay = await light_meter_session_model_1.default.aggregate([
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Failed to fetch admin analytics" });
    }
};
exports.getHomeToolsAnalytics = getHomeToolsAnalytics;
// ---------- Feed Orchestrator ----------
const getHomeFeed = async (req, res) => {
    try {
        const userId = req.user?.id || "anonymous";
        const now = new Date();
        const [widgets, banners, actions, sections] = await Promise.all([
            home_widget_model_1.default.find({ isActive: true }).sort({ defaultOrder: 1 }),
            home_banner_model_1.default.find({
                isActive: true,
                $or: [{ startDate: null }, { startDate: { $lte: now } }],
                $or: [{ endDate: null }, { endDate: { $gte: now } }],
            }).sort({ priority: -1 }),
            home_quick_action_model_1.default.find({ isActive: true }).sort({ order: 1 }),
            home_section_model_1.default.find({ isActive: true }).sort({ order: 1 })
        ]);
        // AI Daily Tip (Mock integration, actual AI Orchestrator can be called here)
        let aiTip = null;
        if (userId !== "anonymous") {
            try {
                const settings = await (0, ai_config_service_1.getAiSettings)();
                const prompt = `Generate a single short (max 2 sentences) garden tip or fact.`;
                const llmResult = await (0, llm_provider_1.askLlm)(settings, prompt, "llm", [], "search");
                aiTip = { title: "Daily Tip", message: llmResult.message };
            }
            catch (e) {
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
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Failed to load home feed" });
    }
};
exports.getHomeFeed = getHomeFeed;
const trackHomeEvent = async (req, res) => {
    try {
        const userId = req.user?.id;
        const { eventType, entityType, entityId } = req.body;
        if (!eventType || !entityType || !entityId) {
            return res.status(400).json({ success: false, message: "Missing tracking data" });
        }
        await home_analytics_model_1.default.create({
            userId: userId ? userId : undefined,
            eventType,
            entityType,
            entityId
        });
        return res.status(200).json({ success: true });
    }
    catch (error) {
        return res.status(500).json({ success: false, message: "Failed to track event" });
    }
};
exports.trackHomeEvent = trackHomeEvent;
