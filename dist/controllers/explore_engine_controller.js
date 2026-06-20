"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminExploreStats = exports.deleteExploreSection = exports.updateExploreSection = exports.createExploreSection = exports.getAdminExploreSections = exports.getAdminExplorePlacements = exports.deleteExplorePlacement = exports.updateExplorePlacement = exports.createExplorePlacement = exports.recordExploreEvent = exports.getRecommendations = exports.getTrendingContent = exports.getFeaturedContent = exports.getExploreFeed = void 0;
const explore_section_model_1 = __importDefault(require("../models/explore_section_model"));
const explore_placement_model_1 = __importDefault(require("../models/explore_placement_model"));
const explore_click_event_model_1 = __importDefault(require("../models/explore_click_event_model"));
const store_product_model_1 = __importDefault(require("../models/store_product_model"));
const expert_profile_model_1 = __importDefault(require("../models/expert_profile_model"));
const outbreak_spot_model_1 = __importDefault(require("../models/outbreak_spot_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
const article_model_1 = require("../models/article_model");
const AiRecommendationService_1 = require("../services/AiRecommendationService");
const WeatherService_1 = require("../services/WeatherService");
const api_response_1 = require("../utils/api_response");
const app_error_1 = require("../utils/app_error");
const mongoose_1 = __importDefault(require("mongoose"));
// Helper to fetch weather context safely
const getCachedWeather = async (user) => {
    if (!user || !user.latitude || !user.longitude) {
        return { temp: 25, condition: "Clear", humidity: 50 };
    }
    try {
        const weatherService = new WeatherService_1.WeatherService();
        return await weatherService.getCurrentWeather(user.latitude, user.longitude);
    }
    catch (err) {
        // Return mock fallback on OpenWeatherMap configuration issues
        return { temp: 25, condition: "Clear", humidity: 50 };
    }
};
// @desc    Get dynamic explore feed
// @route   GET /api/explore
// @access  Public (Optional Auth)
const getExploreFeed = async (req, res, next) => {
    try {
        const user = req.user;
        // Fetch active explore sections ordered
        const sections = await explore_section_model_1.default.find({ isActive: true }).sort({ order: 1 });
        const feed = [];
        for (const section of sections) {
            let items = [];
            switch (section.type) {
                case "banner":
                    items = await explore_placement_model_1.default.find({ section: "banner", isActive: true })
                        .sort({ priority: -1 })
                        .limit(5);
                    break;
                case "featured":
                    items = await explore_placement_model_1.default.find({ section: "featured", isActive: true })
                        .sort({ priority: -1 })
                        .limit(6);
                    break;
                case "trending":
                    // Fetch trending content using calculated click counts in last 7 days
                    const sevenDaysAgo = new Date();
                    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                    const trendingAgg = await explore_click_event_model_1.default.aggregate([
                        { $match: { createdAt: { $gte: sevenDaysAgo }, actionType: "click" } },
                        { $group: { _id: "$contentId", count: { $sum: 1 }, contentType: { $first: "$contentType" } } },
                        { $sort: { count: -1 } },
                        { $limit: 6 }
                    ]);
                    // Populate trending items from their respective collections
                    for (const agg of trendingAgg) {
                        if (agg.contentType === "article" && mongoose_1.default.isValidObjectId(agg._id)) {
                            const article = await article_model_1.Article.findById(agg._id);
                            if (article) {
                                items.push({
                                    id: article._id,
                                    type: "article",
                                    title: article.title,
                                    description: article.body.slice(0, 150),
                                    imageUrl: article.imageUrl || ""
                                });
                            }
                        }
                        else if (agg.contentType === "product" && mongoose_1.default.isValidObjectId(agg._id)) {
                            const product = await store_product_model_1.default.findById(agg._id);
                            if (product) {
                                items.push({
                                    id: product._id,
                                    type: "product",
                                    title: product.name,
                                    description: product.subtitle,
                                    imageUrl: product.imageUrl || "",
                                    price: product.price
                                });
                            }
                        }
                    }
                    // Fallback: If no click logs, return first published articles
                    if (items.length === 0) {
                        const fallbackArticles = await article_model_1.Article.find({ isPublished: true }).limit(5);
                        items = fallbackArticles.map(a => ({
                            id: a._id,
                            type: "article",
                            title: a.title,
                            description: a.body.slice(0, 150),
                            imageUrl: a.imageUrl || ""
                        }));
                    }
                    break;
                case "recommendations":
                    if (user) {
                        const weather = await getCachedWeather(user);
                        const recommendationService = new AiRecommendationService_1.AiRecommendationService();
                        items = await recommendationService.generateRecommendations(user._id, weather);
                    }
                    else {
                        // Unauthenticated: Fallback to featured placements
                        const generalPlacements = await explore_placement_model_1.default.find({ section: "featured", isActive: true }).limit(4);
                        items = generalPlacements.map(p => ({
                            id: p._id,
                            contentType: p.contentType,
                            contentId: p.contentId,
                            title: p.title,
                            description: p.description,
                            imageUrl: p.imageUrl,
                            reason: "Recommended based on general popularity."
                        }));
                    }
                    break;
                case "products":
                    const products = await store_product_model_1.default.find().limit(6);
                    items = products.map(p => ({
                        id: p._id,
                        type: "product",
                        title: p.name,
                        imageUrl: p.imageUrl || "",
                        price: p.price,
                        rating: p.rating
                    }));
                    break;
                case "experts":
                    const experts = await user_model_1.default.find({ role: "expert" }).limit(4).select("name avatarUrl");
                    const expertIds = experts.map(e => e._id);
                    const profiles = await expert_profile_model_1.default.find({ userId: { $in: expertIds } });
                    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));
                    items = experts.map(e => {
                        const p = profileMap.get(e._id.toString());
                        return {
                            id: e._id,
                            type: "expert",
                            title: e.name,
                            imageUrl: e.avatarUrl || "",
                            specialization: p?.specialization || "Generalist",
                            experience: p?.yearsExperience || 0
                        };
                    });
                    break;
                case "outbreaks":
                    const spots = await outbreak_spot_model_1.default.find().limit(5);
                    items = spots.map(s => ({
                        id: s._id,
                        type: "outbreak",
                        title: `${s.disease} in ${s.region}`,
                        severity: s.severity,
                        cases: s.cases
                    }));
                    break;
            }
            feed.push({
                id: section._id,
                titleEn: section.titleEn,
                titleAr: section.titleAr,
                type: section.type,
                items
            });
        }
        return (0, api_response_1.ok)(res, { feed });
    }
    catch (error) {
        next(error);
    }
};
exports.getExploreFeed = getExploreFeed;
// @desc    Get featured placements only
// @route   GET /api/explore/featured
// @access  Public
const getFeaturedContent = async (req, res, next) => {
    try {
        const placements = await explore_placement_model_1.default.find({ section: "featured", isActive: true })
            .sort({ priority: -1 });
        return (0, api_response_1.ok)(res, { placements });
    }
    catch (error) {
        next(error);
    }
};
exports.getFeaturedContent = getFeaturedContent;
// @desc    Get trending content calculated dynamically
// @route   GET /api/explore/trending
// @access  Public
const getTrendingContent = async (req, res, next) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const trendingAgg = await explore_click_event_model_1.default.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, actionType: "click" } },
            { $group: { _id: "$contentId", count: { $sum: 1 }, contentType: { $first: "$contentType" } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        const result = [];
        for (const agg of trendingAgg) {
            if (agg.contentType === "article" && mongoose_1.default.isValidObjectId(agg._id)) {
                const article = await article_model_1.Article.findById(agg._id);
                if (article) {
                    result.push({
                        id: article._id,
                        type: "article",
                        title: article.title,
                        imageUrl: article.imageUrl || ""
                    });
                }
            }
            else if (agg.contentType === "product" && mongoose_1.default.isValidObjectId(agg._id)) {
                const product = await store_product_model_1.default.findById(agg._id);
                if (product) {
                    result.push({
                        id: product._id,
                        type: "product",
                        title: product.name,
                        imageUrl: product.imageUrl || "",
                        price: product.price
                    });
                }
            }
        }
        return (0, api_response_1.ok)(res, { trending: result });
    }
    catch (error) {
        next(error);
    }
};
exports.getTrendingContent = getTrendingContent;
// @desc    Get personalized AI recommendations
// @route   GET /api/explore/recommendations
// @access  Private
const getRecommendations = async (req, res, next) => {
    try {
        const user = req.user;
        if (!user) {
            throw new app_error_1.AppError({ code: "AUTH_REQUIRED", statusCode: 401, message: "Authentication required" });
        }
        const weather = await getCachedWeather(user);
        const recommendationService = new AiRecommendationService_1.AiRecommendationService();
        const recommendations = await recommendationService.generateRecommendations(user._id, weather);
        return (0, api_response_1.ok)(res, { recommendations });
    }
    catch (error) {
        next(error);
    }
};
exports.getRecommendations = getRecommendations;
// @desc    Track click/view explore analytics event
// @route   POST /api/explore/event
// @access  Public
const recordExploreEvent = async (req, res, next) => {
    try {
        const { contentType, contentId, actionType, section, abGroup } = req.body;
        const user = req.user;
        if (!contentType || !contentId || !actionType || !section) {
            throw new app_error_1.AppError({ code: "VALIDATION_FAILED", statusCode: 400, message: "Required telemetry fields missing" });
        }
        const clickEvent = await explore_click_event_model_1.default.create({
            user: user?._id,
            contentType,
            contentId,
            actionType,
            section,
            abGroup: abGroup || (user?._id && user._id.toString().charCodeAt(12) % 2 === 0 ? "A" : "B")
        });
        return (0, api_response_1.ok)(res, { message: "Analytics recorded successfully", eventId: clickEvent._id });
    }
    catch (error) {
        next(error);
    }
};
exports.recordExploreEvent = recordExploreEvent;
// @desc    Admin: Create Explore Placement
// @route   POST /api/explore/admin/content
// @access  Private/Admin
const createExplorePlacement = async (req, res, next) => {
    try {
        const { contentType, contentId, section, title, description, imageUrl, priority, targetInterests, startDate, endDate, abGroup } = req.body;
        if (!contentType || !contentId || !section || !title) {
            throw new app_error_1.AppError({ code: "VALIDATION_FAILED", statusCode: 400, message: "Required fields missing" });
        }
        const placement = await explore_placement_model_1.default.create({
            contentType,
            contentId,
            section,
            title,
            description: description || "",
            imageUrl: imageUrl || "",
            priority: priority || 0,
            targetInterests: targetInterests || [],
            startDate,
            endDate,
            abGroup: abGroup || "all"
        });
        return (0, api_response_1.ok)(res, { message: "Placement created successfully", placement });
    }
    catch (error) {
        next(error);
    }
};
exports.createExplorePlacement = createExplorePlacement;
// @desc    Admin: Update Explore Placement
// @route   PUT /api/explore/admin/content/:id
// @access  Private/Admin
const updateExplorePlacement = async (req, res, next) => {
    try {
        const placement = await explore_placement_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!placement) {
            throw new app_error_1.AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Placement not found" });
        }
        return (0, api_response_1.ok)(res, { message: "Placement updated successfully", placement });
    }
    catch (error) {
        next(error);
    }
};
exports.updateExplorePlacement = updateExplorePlacement;
// @desc    Admin: Delete Explore Placement
// @route   DELETE /api/explore/admin/content/:id
// @access  Private/Admin
const deleteExplorePlacement = async (req, res, next) => {
    try {
        const placement = await explore_placement_model_1.default.findByIdAndDelete(req.params.id);
        if (!placement) {
            throw new app_error_1.AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Placement not found" });
        }
        return (0, api_response_1.ok)(res, { message: "Placement deleted successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteExplorePlacement = deleteExplorePlacement;
// @desc    Admin: List Explore Placements
// @route   GET /api/explore/admin/content
// @access  Private/Admin
const getAdminExplorePlacements = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search;
        const section = req.query.section;
        const contentType = req.query.contentType;
        const isActive = req.query.isActive;
        const query = {};
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } }
            ];
        }
        if (section)
            query.section = section;
        if (contentType)
            query.contentType = contentType;
        if (isActive !== undefined)
            query.isActive = isActive === 'true';
        const placements = await explore_placement_model_1.default.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);
        const total = await explore_placement_model_1.default.countDocuments(query);
        return (0, api_response_1.ok)(res, {
            placements,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminExplorePlacements = getAdminExplorePlacements;
// @desc    Admin: Get Explore Sections
// @route   GET /api/explore/admin/sections
// @access  Private/Admin
const getAdminExploreSections = async (req, res, next) => {
    try {
        const sections = await explore_section_model_1.default.find().sort({ order: 1 });
        return (0, api_response_1.ok)(res, { sections });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminExploreSections = getAdminExploreSections;
// @desc    Admin: Create Explore Section
// @route   POST /api/explore/admin/sections
// @access  Private/Admin
const createExploreSection = async (req, res, next) => {
    try {
        const { titleEn, titleAr, type, order, isActive } = req.body;
        if (!titleEn || !type) {
            throw new app_error_1.AppError({ code: "VALIDATION_FAILED", statusCode: 400, message: "Required fields missing" });
        }
        const section = await explore_section_model_1.default.create({
            titleEn,
            titleAr: titleAr || titleEn,
            type,
            order: order || 0,
            isActive: isActive !== undefined ? isActive : true
        });
        return (0, api_response_1.ok)(res, { message: "Section created successfully", section });
    }
    catch (error) {
        next(error);
    }
};
exports.createExploreSection = createExploreSection;
// @desc    Admin: Update Explore Section
// @route   PUT /api/explore/admin/sections/:id
// @access  Private/Admin
const updateExploreSection = async (req, res, next) => {
    try {
        const section = await explore_section_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!section) {
            throw new app_error_1.AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Section not found" });
        }
        return (0, api_response_1.ok)(res, { message: "Section updated successfully", section });
    }
    catch (error) {
        next(error);
    }
};
exports.updateExploreSection = updateExploreSection;
// @desc    Admin: Delete Explore Section
// @route   DELETE /api/explore/admin/sections/:id
// @access  Private/Admin
const deleteExploreSection = async (req, res, next) => {
    try {
        const section = await explore_section_model_1.default.findByIdAndDelete(req.params.id);
        if (!section) {
            throw new app_error_1.AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Section not found" });
        }
        return (0, api_response_1.ok)(res, { message: "Section deleted successfully" });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteExploreSection = deleteExploreSection;
// @desc    Admin: Get Discovery feed analytics
// @route   GET /api/explore/admin/stats
// @access  Private/Admin
const getAdminExploreStats = async (req, res, next) => {
    try {
        const totalViews = await explore_click_event_model_1.default.countDocuments({ actionType: "view" });
        const totalClicks = await explore_click_event_model_1.default.countDocuments({ actionType: "click" });
        const totalBookmarks = await explore_click_event_model_1.default.countDocuments({ actionType: "bookmark" });
        const totalShares = await explore_click_event_model_1.default.countDocuments({ actionType: "share" });
        const globalCtr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;
        // CTR by A/B testing splits
        const viewsGroupA = await explore_click_event_model_1.default.countDocuments({ abGroup: "A", actionType: "view" });
        const clicksGroupA = await explore_click_event_model_1.default.countDocuments({ abGroup: "A", actionType: "click" });
        const ctrGroupA = viewsGroupA > 0 ? Math.round((clicksGroupA / viewsGroupA) * 100) : 0;
        const viewsGroupB = await explore_click_event_model_1.default.countDocuments({ abGroup: "B", actionType: "view" });
        const clicksGroupB = await explore_click_event_model_1.default.countDocuments({ abGroup: "B", actionType: "click" });
        const ctrGroupB = viewsGroupB > 0 ? Math.round((clicksGroupB / viewsGroupB) * 100) : 0;
        // CTR by section type
        const sectionCtrAgg = await explore_click_event_model_1.default.aggregate([
            { $group: { _id: { section: "$section", action: "$actionType" }, count: { $sum: 1 } } }
        ]);
        const sectionStats = {};
        for (const agg of sectionCtrAgg) {
            const sectionName = agg._id.section;
            const action = agg._id.action;
            if (!sectionStats[sectionName]) {
                sectionStats[sectionName] = { views: 0, clicks: 0, ctr: 0 };
            }
            if (action === "view")
                sectionStats[sectionName].views = agg.count;
            if (action === "click")
                sectionStats[sectionName].clicks = agg.count;
        }
        for (const sectionName of Object.keys(sectionStats)) {
            const stats = sectionStats[sectionName];
            stats.ctr = stats.views > 0 ? Math.round((stats.clicks / stats.views) * 100) : 0;
        }
        return (0, api_response_1.ok)(res, {
            totalViews,
            totalClicks,
            totalBookmarks,
            totalShares,
            globalCtr,
            abGroupStats: {
                ctrGroupA,
                ctrGroupB,
                viewsGroupA,
                viewsGroupB
            },
            sectionStats
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAdminExploreStats = getAdminExploreStats;
