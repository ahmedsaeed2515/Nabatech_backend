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
exports.trackHomeEvent = exports.getHomeFeed = exports.getHomeToolsAnalytics = exports.getWateringRecommendation = exports.createWateringHistory = exports.getWateringHistory = exports.getLightRecommendation = exports.createLightMeterHistory = exports.getLightMeterHistory = void 0;
var light_meter_session_model_1 = __importDefault(require("../models/light_meter_session_model"));
var watering_calculation_model_1 = __importDefault(require("../models/watering_calculation_model"));
var home_widget_model_1 = __importDefault(require("../models/home_widget_model"));
var home_banner_model_1 = __importDefault(require("../models/home_banner_model"));
var home_quick_action_model_1 = __importDefault(require("../models/home_quick_action_model"));
var home_section_model_1 = __importDefault(require("../models/home_section_model"));
var home_analytics_model_1 = __importDefault(require("../models/home_analytics_model"));
var ai_config_service_1 = require("../services/ai/ai_config_service");
var llm_provider_1 = require("../services/ai/llm_provider");
var toLightPayload = function (item) { return ({
    id: item._id,
    plantId: item.plantId || null,
    lux: item.lux,
    zone: item.zone,
    createdAt: item.createdAt,
}); };
var toWaterPayload = function (item) { return ({
    id: item._id,
    plantType: item.plantType || null,
    potSize: item.potSize,
    season: item.season,
    location: item.location,
    days: item.days,
    volumeMl: item.volumeMl,
    createdAt: item.createdAt,
}); };
// ---------- Light Meter ----------
var getLightMeterHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, cursor, limit, pageSize, query, items, hasNext, results, nextCursor, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = req.user.id;
                _a = req.query, cursor = _a.cursor, limit = _a.limit;
                pageSize = Math.min(parseInt(limit) || 20, 50);
                query = { user: userId };
                if (cursor)
                    query._id = { $lt: cursor };
                return [4 /*yield*/, light_meter_session_model_1.default.find(query).sort({ _id: -1 }).limit(pageSize + 1)];
            case 1:
                items = _b.sent();
                hasNext = items.length > pageSize;
                results = hasNext ? items.slice(0, pageSize) : items;
                nextCursor = hasNext ? results[results.length - 1]._id : null;
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            items: results.map(toLightPayload),
                            pageInfo: { nextCursor: nextCursor, limit: pageSize },
                        },
                    })];
            case 2:
                error_1 = _b.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to fetch light meter history" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getLightMeterHistory = getLightMeterHistory;
var createLightMeterHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, plantId, plantLibraryId, lux, zone, clientOperationId, source, created, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = req.user.id;
                _a = req.body, plantId = _a.plantId, plantLibraryId = _a.plantLibraryId, lux = _a.lux, zone = _a.zone, clientOperationId = _a.clientOperationId, source = _a.source;
                if (lux === undefined || !zone) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "lux and zone are required" })];
                }
                return [4 /*yield*/, light_meter_session_model_1.default.create({
                        user: userId,
                        plantId: plantId ? String(plantId).trim() : undefined,
                        plantLibraryId: plantLibraryId ? plantLibraryId : undefined,
                        lux: Number(lux),
                        zone: String(zone).trim(),
                        clientOperationId: clientOperationId ? String(clientOperationId).trim() : undefined,
                        source: source !== null && source !== void 0 ? source : "local",
                    }).catch(function (err) {
                        if (err.code === 11000)
                            throw { status: 409, code: "CONFLICT", message: "Duplicate operation" };
                        throw err;
                    })];
            case 1:
                created = _b.sent();
                return [2 /*return*/, res.status(201).json({ success: true, data: toLightPayload(created) })];
            case 2:
                error_2 = _b.sent();
                if (error_2.status === 409)
                    return [2 /*return*/, res.status(409).json({ success: false, code: "CONFLICT", message: error_2.message })];
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to save light meter reading" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createLightMeterHistory = createLightMeterHistory;
var getLightRecommendation = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var plantId, recommendationMap, recommendedLux;
    var _a;
    return __generator(this, function (_b) {
        try {
            plantId = String(req.params.plantId || "").trim().toLowerCase();
            recommendationMap = {
                aloe: 1400,
                sunflower: 2400,
                pothos: 700,
                snake_plant: 450,
                monstera: 900,
            };
            recommendedLux = (_a = recommendationMap[plantId]) !== null && _a !== void 0 ? _a : 900;
            return [2 /*return*/, res.status(200).json({ success: true, data: { plantId: plantId, recommendedLux: recommendedLux } })];
        }
        catch (error) {
            return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to get light recommendation" })];
        }
        return [2 /*return*/];
    });
}); };
exports.getLightRecommendation = getLightRecommendation;
// ---------- Watering ----------
var getWateringHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, cursor, limit, pageSize, query, items, hasNext, results, nextCursor, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = req.user.id;
                _a = req.query, cursor = _a.cursor, limit = _a.limit;
                pageSize = Math.min(parseInt(limit) || 20, 50);
                query = { user: userId };
                if (cursor)
                    query._id = { $lt: cursor };
                return [4 /*yield*/, watering_calculation_model_1.default.find(query).sort({ _id: -1 }).limit(pageSize + 1)];
            case 1:
                items = _b.sent();
                hasNext = items.length > pageSize;
                results = hasNext ? items.slice(0, pageSize) : items;
                nextCursor = hasNext ? results[results.length - 1]._id : null;
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            items: results.map(toWaterPayload),
                            pageInfo: { nextCursor: nextCursor, limit: pageSize },
                        },
                    })];
            case 2:
                error_3 = _b.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to fetch watering history" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getWateringHistory = getWateringHistory;
var createWateringHistory = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, plantType, plantLibraryId, potSize, season, location_1, days, volumeMl, clientOperationId, source, created, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                userId = req.user.id;
                _a = req.body, plantType = _a.plantType, plantLibraryId = _a.plantLibraryId, potSize = _a.potSize, season = _a.season, location_1 = _a.location, days = _a.days, volumeMl = _a.volumeMl, clientOperationId = _a.clientOperationId, source = _a.source;
                if (!potSize || !season || !location_1 || days === undefined || volumeMl === undefined) {
                    return [2 /*return*/, res.status(400).json({
                            success: false,
                            message: "potSize, season, location, days and volumeMl are required",
                        })];
                }
                return [4 /*yield*/, watering_calculation_model_1.default.create({
                        user: userId,
                        plantType: plantType ? String(plantType).trim() : undefined,
                        plantLibraryId: plantLibraryId ? plantLibraryId : undefined,
                        potSize: String(potSize).trim(),
                        season: String(season).trim(),
                        location: String(location_1).trim(),
                        days: Number(days),
                        volumeMl: Number(volumeMl),
                        clientOperationId: clientOperationId ? String(clientOperationId).trim() : undefined,
                        source: source !== null && source !== void 0 ? source : "local",
                    }).catch(function (err) {
                        if (err.code === 11000)
                            throw { status: 409, code: "CONFLICT", message: "Duplicate operation" };
                        throw err;
                    })];
            case 1:
                created = _b.sent();
                return [2 /*return*/, res.status(201).json({ success: true, data: toWaterPayload(created) })];
            case 2:
                error_4 = _b.sent();
                if (error_4.status === 409)
                    return [2 /*return*/, res.status(409).json({ success: false, code: "CONFLICT", message: error_4.message })];
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to save watering calculation" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createWateringHistory = createWateringHistory;
var getWateringRecommendation = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, plantType, potSize, season, location_2, baseDays, seasonDelta, locationDelta, potDelta, days, volumeMl;
    return __generator(this, function (_b) {
        try {
            _a = req.query, plantType = _a.plantType, potSize = _a.potSize, season = _a.season, location_2 = _a.location;
            baseDays = String(plantType || "").toLowerCase().includes("succulent") ? 10 : 5;
            seasonDelta = String(season || "").toLowerCase() === "summer" ? -1 : 1;
            locationDelta = String(location_2 || "").toLowerCase() === "outdoor" ? -1 : 0;
            potDelta = String(potSize || "").toLowerCase() === "large" ? 2 : 0;
            days = Math.max(1, baseDays + seasonDelta + locationDelta + potDelta);
            volumeMl = String(potSize || "").toLowerCase() === "small" ? 220 : 350;
            return [2 /*return*/, res.status(200).json({ success: true, data: { days: days, volumeMl: volumeMl } })];
        }
        catch (error) {
            return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to get watering recommendation" })];
        }
        return [2 /*return*/];
    });
}); };
exports.getWateringRecommendation = getWateringRecommendation;
// ---------- Admin Analytics ----------
var getHomeToolsAnalytics = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var user, _a, from, to, timeZone, match, _b, lightRes, wateringRes, byDay, error_5;
    var _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                _e.trys.push([0, 3, , 4]);
                user = req.user;
                if (user.role !== "admin") {
                    return [2 /*return*/, res.status(403).json({ success: false, code: "AUTH_FORBIDDEN", message: "Admin access required" })];
                }
                _a = req.query, from = _a.from, to = _a.to, timeZone = _a.timeZone;
                match = {};
                if (from || to) {
                    match.createdAt = {};
                    if (from)
                        match.createdAt.$gte = new Date(from);
                    if (to)
                        match.createdAt.$lte = new Date(to);
                }
                return [4 /*yield*/, Promise.all([
                        light_meter_session_model_1.default.aggregate([{ $match: match }, { $group: { _id: null, count: { $sum: 1 } } }]),
                        watering_calculation_model_1.default.aggregate([{ $match: match }, { $group: { _id: null, count: { $sum: 1 } } }]),
                    ])];
            case 1:
                _b = _e.sent(), lightRes = _b[0], wateringRes = _b[1];
                return [4 /*yield*/, light_meter_session_model_1.default.aggregate([
                        { $match: match },
                        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: timeZone || "UTC" } }, count: { $sum: 1 } } },
                        { $sort: { _id: 1 } },
                    ])];
            case 2:
                byDay = _e.sent();
                return [2 /*return*/, res.status(200).json({
                        success: true,
                        data: {
                            light: ((_c = lightRes[0]) === null || _c === void 0 ? void 0 : _c.count) || 0,
                            watering: ((_d = wateringRes[0]) === null || _d === void 0 ? void 0 : _d.count) || 0,
                            byDay: byDay,
                        },
                    })];
            case 3:
                error_5 = _e.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to fetch admin analytics" })];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getHomeToolsAnalytics = getHomeToolsAnalytics;
// ---------- Feed Orchestrator ----------
var getHomeFeed = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, now, _a, widgets, banners, actions, sections, aiTip, settings, prompt_1, llmResult, e_1, error_6;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 7, , 8]);
                userId = ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id) || "anonymous";
                now = new Date();
                return [4 /*yield*/, Promise.all([
                        home_widget_model_1.default.find({ isActive: true }).sort({ defaultOrder: 1 }),
                        home_banner_model_1.default.find({
                            isActive: true,
                            $and: [
                                { $or: [{ startDate: null }, { startDate: { $lte: now } }] },
                                { $or: [{ endDate: null }, { endDate: { $gte: now } }] }
                            ]
                        }).sort({ priority: -1 }),
                        home_quick_action_model_1.default.find({ isActive: true }).sort({ order: 1 }),
                        home_section_model_1.default.find({ isActive: true }).sort({ order: 1 })
                    ])];
            case 1:
                _a = _c.sent(), widgets = _a[0], banners = _a[1], actions = _a[2], sections = _a[3];
                aiTip = null;
                if (!(userId !== "anonymous")) return [3 /*break*/, 6];
                _c.label = 2;
            case 2:
                _c.trys.push([2, 5, , 6]);
                return [4 /*yield*/, (0, ai_config_service_1.getAiSettings)()];
            case 3:
                settings = _c.sent();
                prompt_1 = "Generate a single short (max 2 sentences) garden tip or fact.";
                return [4 /*yield*/, (0, llm_provider_1.askLlm)(settings, prompt_1, "llm", [], "search")];
            case 4:
                llmResult = _c.sent();
                aiTip = { title: "Daily Tip", message: llmResult.message };
                return [3 /*break*/, 6];
            case 5:
                e_1 = _c.sent();
                // Fallback
                aiTip = { title: "Daily Tip", message: "Watering early morning prevents evaporation and fungal disease." };
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/, res.status(200).json({
                    success: true,
                    data: {
                        banners: banners.map(function (b) { return ({ id: b._id, title: b.title, imageUrl: b.imageUrl, targetUrl: b.targetUrl }); }),
                        quickActions: actions.map(function (a) { return ({ id: a._id, label: a.label, iconName: a.iconName, deeplink: a.deeplink }); }),
                        widgets: widgets.map(function (w) { return ({ id: w._id, widgetId: w.widgetId, title: w.title, description: w.description }); }),
                        sections: sections.map(function (s) { return ({ id: s._id, sectionId: s.sectionId, title: s.title, type: s.type }); }),
                        aiTip: aiTip
                    }
                })];
            case 7:
                error_6 = _c.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to load home feed" })];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.getHomeFeed = getHomeFeed;
var trackHomeEvent = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, eventType, entityType, entityId, error_7;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                userId = (_b = req.user) === null || _b === void 0 ? void 0 : _b.id;
                _a = req.body, eventType = _a.eventType, entityType = _a.entityType, entityId = _a.entityId;
                if (!eventType || !entityType || !entityId) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Missing tracking data" })];
                }
                return [4 /*yield*/, home_analytics_model_1.default.create({
                        userId: userId ? userId : undefined,
                        eventType: eventType,
                        entityType: entityType,
                        entityId: entityId
                    })];
            case 1:
                _c.sent();
                return [2 /*return*/, res.status(200).json({ success: true })];
            case 2:
                error_7 = _c.sent();
                return [2 /*return*/, res.status(500).json({ success: false, message: "Failed to track event" })];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.trackHomeEvent = trackHomeEvent;
