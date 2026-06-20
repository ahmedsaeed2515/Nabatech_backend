"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getHomeAnalytics = exports.deleteSection = exports.updateSection = exports.createSection = exports.getSections = exports.deleteQuickAction = exports.updateQuickAction = exports.createQuickAction = exports.getQuickActions = exports.deleteBanner = exports.updateBanner = exports.createBanner = exports.getBanners = exports.deleteWidget = exports.updateWidget = exports.createWidget = exports.getWidgets = void 0;
const home_widget_model_1 = __importDefault(require("../models/home_widget_model"));
const home_banner_model_1 = __importDefault(require("../models/home_banner_model"));
const home_quick_action_model_1 = __importDefault(require("../models/home_quick_action_model"));
const home_section_model_1 = __importDefault(require("../models/home_section_model"));
const home_analytics_model_1 = __importDefault(require("../models/home_analytics_model"));
const api_response_1 = require("../utils/api_response");
// --- Generic CRUD Helper ---
const getGeneric = (Model) => async (req, res, next) => {
    try {
        const items = await Model.find().sort({ order: 1, defaultOrder: 1, priority: -1, createdAt: -1 });
        return (0, api_response_1.ok)(res, { items });
    }
    catch (error) {
        next(error);
    }
};
const createGeneric = (Model) => async (req, res, next) => {
    try {
        const item = await Model.create(req.body);
        return res.status(201).json({ success: true, item });
    }
    catch (error) {
        next(error);
    }
};
const updateGeneric = (Model) => async (req, res, next) => {
    try {
        const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!item)
            return res.status(404).json({ success: false, message: "Not found" });
        return (0, api_response_1.ok)(res, { item });
    }
    catch (error) {
        next(error);
    }
};
const deleteGeneric = (Model) => async (req, res, next) => {
    try {
        const item = await Model.findByIdAndDelete(req.params.id);
        if (!item)
            return res.status(404).json({ success: false, message: "Not found" });
        return (0, api_response_1.ok)(res, { message: "Deleted successfully" });
    }
    catch (error) {
        next(error);
    }
};
// --- Controllers ---
exports.getWidgets = getGeneric(home_widget_model_1.default);
exports.createWidget = createGeneric(home_widget_model_1.default);
exports.updateWidget = updateGeneric(home_widget_model_1.default);
exports.deleteWidget = deleteGeneric(home_widget_model_1.default);
exports.getBanners = getGeneric(home_banner_model_1.default);
exports.createBanner = createGeneric(home_banner_model_1.default);
exports.updateBanner = updateGeneric(home_banner_model_1.default);
exports.deleteBanner = deleteGeneric(home_banner_model_1.default);
exports.getQuickActions = getGeneric(home_quick_action_model_1.default);
exports.createQuickAction = createGeneric(home_quick_action_model_1.default);
exports.updateQuickAction = updateGeneric(home_quick_action_model_1.default);
exports.deleteQuickAction = deleteGeneric(home_quick_action_model_1.default);
exports.getSections = getGeneric(home_section_model_1.default);
exports.createSection = createGeneric(home_section_model_1.default);
exports.updateSection = updateGeneric(home_section_model_1.default);
exports.deleteSection = deleteGeneric(home_section_model_1.default);
// --- Analytics ---
const getHomeAnalytics = async (req, res, next) => {
    try {
        const { from, to, type } = req.query;
        const match = {};
        if (type)
            match.entityType = type;
        if (from || to) {
            match.createdAt = {};
            if (from)
                match.createdAt.$gte = new Date(from);
            if (to)
                match.createdAt.$lte = new Date(to);
        }
        const views = await home_analytics_model_1.default.countDocuments({ ...match, eventType: "view" });
        const clicks = await home_analytics_model_1.default.countDocuments({ ...match, eventType: "click" });
        // Group by entity
        const performance = await home_analytics_model_1.default.aggregate([
            { $match: match },
            { $group: {
                    _id: { entityId: "$entityId", eventType: "$eventType" },
                    count: { $sum: 1 }
                } },
        ]);
        return (0, api_response_1.ok)(res, { views, clicks, performance });
    }
    catch (error) {
        next(error);
    }
};
exports.getHomeAnalytics = getHomeAnalytics;
