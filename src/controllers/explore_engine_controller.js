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
exports.getAdminExploreStats = exports.deleteExploreSection = exports.updateExploreSection = exports.createExploreSection = exports.getAdminExploreSections = exports.getAdminExplorePlacements = exports.deleteExplorePlacement = exports.updateExplorePlacement = exports.createExplorePlacement = exports.recordExploreEvent = exports.getRecommendations = exports.getTrendingContent = exports.getFeaturedContent = exports.getExploreFeed = void 0;
var explore_section_model_1 = __importDefault(require("../models/explore_section_model"));
var explore_placement_model_1 = __importDefault(require("../models/explore_placement_model"));
var explore_click_event_model_1 = __importDefault(require("../models/explore_click_event_model"));
var store_product_model_1 = __importDefault(require("../models/store_product_model"));
var expert_profile_model_1 = __importDefault(require("../models/expert_profile_model"));
var outbreak_spot_model_1 = __importDefault(require("../models/outbreak_spot_model"));
var user_model_1 = __importDefault(require("../models/user_model"));
var article_model_1 = require("../models/article_model");
var AiRecommendationService_1 = require("../services/AiRecommendationService");
var WeatherService_1 = require("../services/WeatherService");
var api_response_1 = require("../utils/api_response");
var app_error_1 = require("../utils/app_error");
var mongoose_1 = __importDefault(require("mongoose"));
// Helper to fetch weather context safely
var getCachedWeather = function (user) { return __awaiter(void 0, void 0, void 0, function () {
    var weatherService, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!user || !user.latitude || !user.longitude) {
                    return [2 /*return*/, { temp: 25, condition: "Clear", humidity: 50 }];
                }
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                weatherService = new WeatherService_1.WeatherService();
                return [4 /*yield*/, weatherService.getCurrentWeather(user.latitude, user.longitude)];
            case 2: return [2 /*return*/, _a.sent()];
            case 3:
                err_1 = _a.sent();
                // Return mock fallback on OpenWeatherMap configuration issues
                return [2 /*return*/, { temp: 25, condition: "Clear", humidity: 50 }];
            case 4: return [2 /*return*/];
        }
    });
}); };
// @desc    Get dynamic explore feed
// @route   GET /api/explore
// @access  Public (Optional Auth)
var getExploreFeed = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, sections, feed, _loop_1, _i, sections_1, section, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                user = req.user;
                return [4 /*yield*/, explore_section_model_1.default.find({ isActive: true }).sort({ order: 1 })];
            case 1:
                sections = _a.sent();
                feed = [];
                _loop_1 = function (section) {
                    var items, _b, sevenDaysAgo, trendingAgg, _c, trendingAgg_1, agg, article, product, fallbackArticles, weather, recommendationService, generalPlacements, products, experts, expertIds, profiles, profileMap_1, spots;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                items = [];
                                _b = section.type;
                                switch (_b) {
                                    case "banner": return [3 /*break*/, 1];
                                    case "featured": return [3 /*break*/, 3];
                                    case "trending": return [3 /*break*/, 5];
                                    case "recommendations": return [3 /*break*/, 15];
                                    case "products": return [3 /*break*/, 21];
                                    case "experts": return [3 /*break*/, 23];
                                    case "outbreaks": return [3 /*break*/, 26];
                                }
                                return [3 /*break*/, 28];
                            case 1: return [4 /*yield*/, explore_placement_model_1.default.find({ section: "banner", isActive: true })
                                    .sort({ priority: -1 })
                                    .limit(5)];
                            case 2:
                                items = _d.sent();
                                return [3 /*break*/, 28];
                            case 3: return [4 /*yield*/, explore_placement_model_1.default.find({ section: "featured", isActive: true })
                                    .sort({ priority: -1 })
                                    .limit(6)];
                            case 4:
                                items = _d.sent();
                                return [3 /*break*/, 28];
                            case 5:
                                sevenDaysAgo = new Date();
                                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                                return [4 /*yield*/, explore_click_event_model_1.default.aggregate([
                                        { $match: { createdAt: { $gte: sevenDaysAgo }, actionType: "click" } },
                                        { $group: { _id: "$contentId", count: { $sum: 1 }, contentType: { $first: "$contentType" } } },
                                        { $sort: { count: -1 } },
                                        { $limit: 6 }
                                    ])];
                            case 6:
                                trendingAgg = _d.sent();
                                _c = 0, trendingAgg_1 = trendingAgg;
                                _d.label = 7;
                            case 7:
                                if (!(_c < trendingAgg_1.length)) return [3 /*break*/, 12];
                                agg = trendingAgg_1[_c];
                                if (!(agg.contentType === "article" && mongoose_1.default.isValidObjectId(agg._id))) return [3 /*break*/, 9];
                                return [4 /*yield*/, article_model_1.Article.findById(agg._id)];
                            case 8:
                                article = _d.sent();
                                if (article) {
                                    items.push({
                                        id: article._id,
                                        type: "article",
                                        title: article.title,
                                        description: article.body.slice(0, 150),
                                        imageUrl: article.imageUrl || ""
                                    });
                                }
                                return [3 /*break*/, 11];
                            case 9:
                                if (!(agg.contentType === "product" && mongoose_1.default.isValidObjectId(agg._id))) return [3 /*break*/, 11];
                                return [4 /*yield*/, store_product_model_1.default.findById(agg._id)];
                            case 10:
                                product = _d.sent();
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
                                _d.label = 11;
                            case 11:
                                _c++;
                                return [3 /*break*/, 7];
                            case 12:
                                if (!(items.length === 0)) return [3 /*break*/, 14];
                                return [4 /*yield*/, article_model_1.Article.find({ isPublished: true }).limit(5)];
                            case 13:
                                fallbackArticles = _d.sent();
                                items = fallbackArticles.map(function (a) { return ({
                                    id: a._id,
                                    type: "article",
                                    title: a.title,
                                    description: a.body.slice(0, 150),
                                    imageUrl: a.imageUrl || ""
                                }); });
                                _d.label = 14;
                            case 14: return [3 /*break*/, 28];
                            case 15:
                                if (!user) return [3 /*break*/, 18];
                                return [4 /*yield*/, getCachedWeather(user)];
                            case 16:
                                weather = _d.sent();
                                recommendationService = new AiRecommendationService_1.AiRecommendationService();
                                return [4 /*yield*/, recommendationService.generateRecommendations(user._id, weather)];
                            case 17:
                                items = _d.sent();
                                return [3 /*break*/, 20];
                            case 18: return [4 /*yield*/, explore_placement_model_1.default.find({ section: "featured", isActive: true }).limit(4)];
                            case 19:
                                generalPlacements = _d.sent();
                                items = generalPlacements.map(function (p) { return ({
                                    id: p._id,
                                    contentType: p.contentType,
                                    contentId: p.contentId,
                                    title: p.title,
                                    description: p.description,
                                    imageUrl: p.imageUrl,
                                    reason: "Recommended based on general popularity."
                                }); });
                                _d.label = 20;
                            case 20: return [3 /*break*/, 28];
                            case 21: return [4 /*yield*/, store_product_model_1.default.find().limit(6)];
                            case 22:
                                products = _d.sent();
                                items = products.map(function (p) { return ({
                                    id: p._id,
                                    type: "product",
                                    title: p.name,
                                    imageUrl: p.imageUrl || "",
                                    price: p.price,
                                    rating: p.rating
                                }); });
                                return [3 /*break*/, 28];
                            case 23: return [4 /*yield*/, user_model_1.default.find({ role: "expert" }).limit(4).select("name avatarUrl")];
                            case 24:
                                experts = _d.sent();
                                expertIds = experts.map(function (e) { return e._id; });
                                return [4 /*yield*/, expert_profile_model_1.default.find({ userId: { $in: expertIds } })];
                            case 25:
                                profiles = _d.sent();
                                profileMap_1 = new Map(profiles.map(function (p) { return [p.userId.toString(), p]; }));
                                items = experts.map(function (e) {
                                    var p = profileMap_1.get(e._id.toString());
                                    return {
                                        id: e._id,
                                        type: "expert",
                                        title: e.name,
                                        imageUrl: e.avatarUrl || "",
                                        specialization: (p === null || p === void 0 ? void 0 : p.specialization) || "Generalist",
                                        experience: (p === null || p === void 0 ? void 0 : p.yearsExperience) || 0
                                    };
                                });
                                return [3 /*break*/, 28];
                            case 26: return [4 /*yield*/, outbreak_spot_model_1.default.find().limit(5)];
                            case 27:
                                spots = _d.sent();
                                items = spots.map(function (s) { return ({
                                    id: s._id,
                                    type: "outbreak",
                                    title: "".concat(s.disease, " in ").concat(s.region),
                                    severity: s.severity,
                                    cases: s.cases
                                }); });
                                return [3 /*break*/, 28];
                            case 28:
                                feed.push({
                                    id: section._id,
                                    titleEn: section.titleEn,
                                    titleAr: section.titleAr,
                                    type: section.type,
                                    items: items
                                });
                                return [2 /*return*/];
                        }
                    });
                };
                _i = 0, sections_1 = sections;
                _a.label = 2;
            case 2:
                if (!(_i < sections_1.length)) return [3 /*break*/, 5];
                section = sections_1[_i];
                return [5 /*yield**/, _loop_1(section)];
            case 3:
                _a.sent();
                _a.label = 4;
            case 4:
                _i++;
                return [3 /*break*/, 2];
            case 5: return [2 /*return*/, (0, api_response_1.ok)(res, { feed: feed })];
            case 6:
                error_1 = _a.sent();
                next(error_1);
                return [3 /*break*/, 7];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.getExploreFeed = getExploreFeed;
// @desc    Get featured placements only
// @route   GET /api/explore/featured
// @access  Public
var getFeaturedContent = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var placements, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, explore_placement_model_1.default.find({ section: "featured", isActive: true })
                        .sort({ priority: -1 })];
            case 1:
                placements = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { placements: placements })];
            case 2:
                error_2 = _a.sent();
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getFeaturedContent = getFeaturedContent;
// @desc    Get trending content calculated dynamically
// @route   GET /api/explore/trending
// @access  Public
var getTrendingContent = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var sevenDaysAgo, trendingAgg, result, _i, trendingAgg_2, agg, article, product, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 8, , 9]);
                sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return [4 /*yield*/, explore_click_event_model_1.default.aggregate([
                        { $match: { createdAt: { $gte: sevenDaysAgo }, actionType: "click" } },
                        { $group: { _id: "$contentId", count: { $sum: 1 }, contentType: { $first: "$contentType" } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ])];
            case 1:
                trendingAgg = _a.sent();
                result = [];
                _i = 0, trendingAgg_2 = trendingAgg;
                _a.label = 2;
            case 2:
                if (!(_i < trendingAgg_2.length)) return [3 /*break*/, 7];
                agg = trendingAgg_2[_i];
                if (!(agg.contentType === "article" && mongoose_1.default.isValidObjectId(agg._id))) return [3 /*break*/, 4];
                return [4 /*yield*/, article_model_1.Article.findById(agg._id)];
            case 3:
                article = _a.sent();
                if (article) {
                    result.push({
                        id: article._id,
                        type: "article",
                        title: article.title,
                        imageUrl: article.imageUrl || ""
                    });
                }
                return [3 /*break*/, 6];
            case 4:
                if (!(agg.contentType === "product" && mongoose_1.default.isValidObjectId(agg._id))) return [3 /*break*/, 6];
                return [4 /*yield*/, store_product_model_1.default.findById(agg._id)];
            case 5:
                product = _a.sent();
                if (product) {
                    result.push({
                        id: product._id,
                        type: "product",
                        title: product.name,
                        imageUrl: product.imageUrl || "",
                        price: product.price
                    });
                }
                _a.label = 6;
            case 6:
                _i++;
                return [3 /*break*/, 2];
            case 7: return [2 /*return*/, (0, api_response_1.ok)(res, { trending: result })];
            case 8:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 9];
            case 9: return [2 /*return*/];
        }
    });
}); };
exports.getTrendingContent = getTrendingContent;
// @desc    Get personalized AI recommendations
// @route   GET /api/explore/recommendations
// @access  Private
var getRecommendations = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var user, weather, recommendationService, recommendations, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                user = req.user;
                if (!user) {
                    throw new app_error_1.AppError({ code: "AUTH_REQUIRED", statusCode: 401, message: "Authentication required" });
                }
                return [4 /*yield*/, getCachedWeather(user)];
            case 1:
                weather = _a.sent();
                recommendationService = new AiRecommendationService_1.AiRecommendationService();
                return [4 /*yield*/, recommendationService.generateRecommendations(user._id, weather)];
            case 2:
                recommendations = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { recommendations: recommendations })];
            case 3:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getRecommendations = getRecommendations;
// @desc    Track click/view explore analytics event
// @route   POST /api/explore/event
// @access  Public
var recordExploreEvent = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, contentType, contentId, actionType, section, abGroup, user, clickEvent, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, contentType = _a.contentType, contentId = _a.contentId, actionType = _a.actionType, section = _a.section, abGroup = _a.abGroup;
                user = req.user;
                if (!contentType || !contentId || !actionType || !section) {
                    throw new app_error_1.AppError({ code: "VALIDATION_FAILED", statusCode: 400, message: "Required telemetry fields missing" });
                }
                return [4 /*yield*/, explore_click_event_model_1.default.create({
                        user: user === null || user === void 0 ? void 0 : user._id,
                        contentType: contentType,
                        contentId: contentId,
                        actionType: actionType,
                        section: section,
                        abGroup: abGroup || ((user === null || user === void 0 ? void 0 : user._id) && user._id.toString().charCodeAt(12) % 2 === 0 ? "A" : "B")
                    })];
            case 1:
                clickEvent = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Analytics recorded successfully", eventId: clickEvent._id })];
            case 2:
                error_5 = _b.sent();
                next(error_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.recordExploreEvent = recordExploreEvent;
// @desc    Admin: Create Explore Placement
// @route   POST /api/explore/admin/content
// @access  Private/Admin
var createExplorePlacement = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, contentType, contentId, section, title, description, imageUrl, priority, targetInterests, startDate, endDate, abGroup, placement, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, contentType = _a.contentType, contentId = _a.contentId, section = _a.section, title = _a.title, description = _a.description, imageUrl = _a.imageUrl, priority = _a.priority, targetInterests = _a.targetInterests, startDate = _a.startDate, endDate = _a.endDate, abGroup = _a.abGroup;
                if (!contentType || !contentId || !section || !title) {
                    throw new app_error_1.AppError({ code: "VALIDATION_FAILED", statusCode: 400, message: "Required fields missing" });
                }
                return [4 /*yield*/, explore_placement_model_1.default.create({
                        contentType: contentType,
                        contentId: contentId,
                        section: section,
                        title: title,
                        description: description || "",
                        imageUrl: imageUrl || "",
                        priority: priority || 0,
                        targetInterests: targetInterests || [],
                        startDate: startDate,
                        endDate: endDate,
                        abGroup: abGroup || "all"
                    })];
            case 1:
                placement = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Placement created successfully", placement: placement })];
            case 2:
                error_6 = _b.sent();
                next(error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createExplorePlacement = createExplorePlacement;
// @desc    Admin: Update Explore Placement
// @route   PUT /api/explore/admin/content/:id
// @access  Private/Admin
var updateExplorePlacement = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var placement, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, explore_placement_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true })];
            case 1:
                placement = _a.sent();
                if (!placement) {
                    throw new app_error_1.AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Placement not found" });
                }
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Placement updated successfully", placement: placement })];
            case 2:
                error_7 = _a.sent();
                next(error_7);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateExplorePlacement = updateExplorePlacement;
// @desc    Admin: Delete Explore Placement
// @route   DELETE /api/explore/admin/content/:id
// @access  Private/Admin
var deleteExplorePlacement = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var placement, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, explore_placement_model_1.default.findByIdAndDelete(req.params.id)];
            case 1:
                placement = _a.sent();
                if (!placement) {
                    throw new app_error_1.AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Placement not found" });
                }
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Placement deleted successfully" })];
            case 2:
                error_8 = _a.sent();
                next(error_8);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteExplorePlacement = deleteExplorePlacement;
// @desc    Admin: List Explore Placements
// @route   GET /api/explore/admin/content
// @access  Private/Admin
var getAdminExplorePlacements = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, search, section, contentType, isActive, query, placements, total, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page) || 1;
                limit = parseInt(req.query.limit) || 10;
                search = req.query.search;
                section = req.query.section;
                contentType = req.query.contentType;
                isActive = req.query.isActive;
                query = {};
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
                return [4 /*yield*/, explore_placement_model_1.default.find(query)
                        .sort({ createdAt: -1 })
                        .skip((page - 1) * limit)
                        .limit(limit)];
            case 1:
                placements = _a.sent();
                return [4 /*yield*/, explore_placement_model_1.default.countDocuments(query)];
            case 2:
                total = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        placements: placements,
                        pagination: {
                            page: page,
                            limit: limit,
                            total: total,
                            pages: Math.ceil(total / limit)
                        }
                    })];
            case 3:
                error_9 = _a.sent();
                next(error_9);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAdminExplorePlacements = getAdminExplorePlacements;
// @desc    Admin: Get Explore Sections
// @route   GET /api/explore/admin/sections
// @access  Private/Admin
var getAdminExploreSections = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var sections, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, explore_section_model_1.default.find().sort({ order: 1 })];
            case 1:
                sections = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { sections: sections })];
            case 2:
                error_10 = _a.sent();
                next(error_10);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAdminExploreSections = getAdminExploreSections;
// @desc    Admin: Create Explore Section
// @route   POST /api/explore/admin/sections
// @access  Private/Admin
var createExploreSection = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, titleEn, titleAr, type, order, isActive, section, error_11;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, titleEn = _a.titleEn, titleAr = _a.titleAr, type = _a.type, order = _a.order, isActive = _a.isActive;
                if (!titleEn || !type) {
                    throw new app_error_1.AppError({ code: "VALIDATION_FAILED", statusCode: 400, message: "Required fields missing" });
                }
                return [4 /*yield*/, explore_section_model_1.default.create({
                        titleEn: titleEn,
                        titleAr: titleAr || titleEn,
                        type: type,
                        order: order || 0,
                        isActive: isActive !== undefined ? isActive : true
                    })];
            case 1:
                section = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Section created successfully", section: section })];
            case 2:
                error_11 = _b.sent();
                next(error_11);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createExploreSection = createExploreSection;
// @desc    Admin: Update Explore Section
// @route   PUT /api/explore/admin/sections/:id
// @access  Private/Admin
var updateExploreSection = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var section, error_12;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, explore_section_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true })];
            case 1:
                section = _a.sent();
                if (!section) {
                    throw new app_error_1.AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Section not found" });
                }
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Section updated successfully", section: section })];
            case 2:
                error_12 = _a.sent();
                next(error_12);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateExploreSection = updateExploreSection;
// @desc    Admin: Delete Explore Section
// @route   DELETE /api/explore/admin/sections/:id
// @access  Private/Admin
var deleteExploreSection = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var section, error_13;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, explore_section_model_1.default.findByIdAndDelete(req.params.id)];
            case 1:
                section = _a.sent();
                if (!section) {
                    throw new app_error_1.AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Section not found" });
                }
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Section deleted successfully" })];
            case 2:
                error_13 = _a.sent();
                next(error_13);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteExploreSection = deleteExploreSection;
// @desc    Admin: Get Discovery feed analytics
// @route   GET /api/explore/admin/stats
// @access  Private/Admin
var getAdminExploreStats = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var totalViews, totalClicks, totalBookmarks, totalShares, globalCtr, viewsGroupA, clicksGroupA, ctrGroupA, viewsGroupB, clicksGroupB, ctrGroupB, sectionCtrAgg, sectionStats, _i, sectionCtrAgg_1, agg, sectionName, action, _a, _b, sectionName, stats, error_14;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 10, , 11]);
                return [4 /*yield*/, explore_click_event_model_1.default.countDocuments({ actionType: "view" })];
            case 1:
                totalViews = _c.sent();
                return [4 /*yield*/, explore_click_event_model_1.default.countDocuments({ actionType: "click" })];
            case 2:
                totalClicks = _c.sent();
                return [4 /*yield*/, explore_click_event_model_1.default.countDocuments({ actionType: "bookmark" })];
            case 3:
                totalBookmarks = _c.sent();
                return [4 /*yield*/, explore_click_event_model_1.default.countDocuments({ actionType: "share" })];
            case 4:
                totalShares = _c.sent();
                globalCtr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;
                return [4 /*yield*/, explore_click_event_model_1.default.countDocuments({ abGroup: "A", actionType: "view" })];
            case 5:
                viewsGroupA = _c.sent();
                return [4 /*yield*/, explore_click_event_model_1.default.countDocuments({ abGroup: "A", actionType: "click" })];
            case 6:
                clicksGroupA = _c.sent();
                ctrGroupA = viewsGroupA > 0 ? Math.round((clicksGroupA / viewsGroupA) * 100) : 0;
                return [4 /*yield*/, explore_click_event_model_1.default.countDocuments({ abGroup: "B", actionType: "view" })];
            case 7:
                viewsGroupB = _c.sent();
                return [4 /*yield*/, explore_click_event_model_1.default.countDocuments({ abGroup: "B", actionType: "click" })];
            case 8:
                clicksGroupB = _c.sent();
                ctrGroupB = viewsGroupB > 0 ? Math.round((clicksGroupB / viewsGroupB) * 100) : 0;
                return [4 /*yield*/, explore_click_event_model_1.default.aggregate([
                        { $group: { _id: { section: "$section", action: "$actionType" }, count: { $sum: 1 } } }
                    ])];
            case 9:
                sectionCtrAgg = _c.sent();
                sectionStats = {};
                for (_i = 0, sectionCtrAgg_1 = sectionCtrAgg; _i < sectionCtrAgg_1.length; _i++) {
                    agg = sectionCtrAgg_1[_i];
                    sectionName = agg._id.section;
                    action = agg._id.action;
                    if (!sectionStats[sectionName]) {
                        sectionStats[sectionName] = { views: 0, clicks: 0, ctr: 0 };
                    }
                    if (action === "view")
                        sectionStats[sectionName].views = agg.count;
                    if (action === "click")
                        sectionStats[sectionName].clicks = agg.count;
                }
                for (_a = 0, _b = Object.keys(sectionStats); _a < _b.length; _a++) {
                    sectionName = _b[_a];
                    stats = sectionStats[sectionName];
                    stats.ctr = stats.views > 0 ? Math.round((stats.clicks / stats.views) * 100) : 0;
                }
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        totalViews: totalViews,
                        totalClicks: totalClicks,
                        totalBookmarks: totalBookmarks,
                        totalShares: totalShares,
                        globalCtr: globalCtr,
                        abGroupStats: {
                            ctrGroupA: ctrGroupA,
                            ctrGroupB: ctrGroupB,
                            viewsGroupA: viewsGroupA,
                            viewsGroupB: viewsGroupB
                        },
                        sectionStats: sectionStats
                    })];
            case 10:
                error_14 = _c.sent();
                next(error_14);
                return [3 /*break*/, 11];
            case 11: return [2 /*return*/];
        }
    });
}); };
exports.getAdminExploreStats = getAdminExploreStats;
