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
exports.updateOutbreak = exports.deleteOutbreak = exports.createOutbreak = exports.deleteExpert = exports.createExpert = exports.deleteStoreProduct = exports.createStoreProduct = exports.getOutbreaks = exports.getExperts = exports.getStoreProducts = void 0;
var store_product_model_1 = __importDefault(require("../models/store_product_model"));
var expert_model_1 = __importDefault(require("../models/expert_model"));
var user_model_1 = __importDefault(require("../models/user_model"));
var expert_profile_model_1 = __importDefault(require("../models/expert_profile_model"));
var outbreak_spot_model_1 = __importDefault(require("../models/outbreak_spot_model"));
var api_response_1 = require("../utils/api_response");
// @desc    Get all store products
// @route   GET /api/explore/store-products
// @access  Public
var getStoreProducts = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var category, query, products, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                category = req.query.category;
                query = {};
                if (category) {
                    query.category = category;
                }
                return [4 /*yield*/, store_product_model_1.default.find(query)];
            case 1:
                products = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, products.map(function (p) { return ({
                        id: p._id,
                        name: p.name,
                        category: p.category,
                        price: p.price,
                        rating: p.rating,
                        subtitle: p.subtitle,
                        imageUrl: p.imageUrl || ""
                    }); }))];
            case 2:
                error_1 = _a.sent();
                res.status(500).json({ success: false, message: "Failed to fetch store products", error: error_1 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getStoreProducts = getStoreProducts;
// @desc    Get all experts
// @route   GET /api/explore/experts
// @access  Public
var getExperts = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var specialty, users, userIds, profilesQuery, profiles, profileMap, _i, profiles_1, p, result, _a, users_1, u, p, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                specialty = req.query.specialty;
                return [4 /*yield*/, user_model_1.default.find({ role: 'expert' }).select('name avatarUrl')];
            case 1:
                users = _b.sent();
                userIds = users.map(function (u) { return u._id; });
                profilesQuery = { userId: { $in: userIds } };
                if (specialty) {
                    profilesQuery.specialization = specialty;
                }
                return [4 /*yield*/, expert_profile_model_1.default.find(profilesQuery)];
            case 2:
                profiles = _b.sent();
                profileMap = new Map();
                for (_i = 0, profiles_1 = profiles; _i < profiles_1.length; _i++) {
                    p = profiles_1[_i];
                    profileMap.set(p.userId.toString(), p);
                }
                result = [];
                for (_a = 0, users_1 = users; _a < users_1.length; _a++) {
                    u = users_1[_a];
                    p = profileMap.get(u._id.toString());
                    // If filtering by specialty, only include users that have a matching profile
                    if (specialty && !p)
                        continue;
                    result.push({
                        id: u._id,
                        name: u.name,
                        avatarUrl: u.avatarUrl,
                        specialization: (p === null || p === void 0 ? void 0 : p.specialization) || 'General',
                        bio: (p === null || p === void 0 ? void 0 : p.bio) || '',
                        yearsExperience: (p === null || p === void 0 ? void 0 : p.yearsExperience) || 0,
                        postsCount: (p === null || p === void 0 ? void 0 : p.expertPostsCount) || 0,
                        repliesCount: (p === null || p === void 0 ? void 0 : p.expertRepliesCount) || 0,
                    });
                }
                res.status(200).json({
                    success: true,
                    data: { items: result }
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _b.sent();
                res.status(500).json({ success: false, message: "Failed to fetch experts", error: error_2 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getExperts = getExperts;
// @desc    Get outbreak spots
// @route   GET /api/explore/outbreaks
// @access  Public
var getOutbreaks = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var spots, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, outbreak_spot_model_1.default.find()];
            case 1:
                spots = _a.sent();
                res.status(200).json({
                    success: true,
                    data: spots.map(function (s) { return ({
                        id: s._id,
                        region: s.region,
                        disease: s.disease,
                        severity: s.severity,
                        cases: s.cases,
                        trendPercent: s.trendPercent,
                        mapX: s.mapX,
                        mapY: s.mapY,
                        colorHex: s.colorHex,
                    }); })
                });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                res.status(500).json({ success: false, message: "Failed to fetch outbreaks", error: error_3 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getOutbreaks = getOutbreaks;
// @desc    Create a store product (Admin only)
// @route   POST /api/explore/store-products
// @access  Private/Admin
var createStoreProduct = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_1, category, price, subtitle, imageUrl, product, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, name_1 = _a.name, category = _a.category, price = _a.price, subtitle = _a.subtitle, imageUrl = _a.imageUrl;
                if (!name_1 || !category || price === undefined || !subtitle) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Please fill in all required fields (name, category, price, subtitle)" })];
                }
                return [4 /*yield*/, store_product_model_1.default.create({
                        name: name_1,
                        category: category,
                        price: Number(price),
                        subtitle: subtitle,
                        imageUrl: imageUrl || "",
                    })];
            case 1:
                product = _b.sent();
                res.status(201).json({
                    success: true,
                    data: {
                        id: product._id,
                        name: product.name,
                        category: product.category,
                        price: product.price,
                        rating: product.rating,
                        subtitle: product.subtitle,
                        imageUrl: product.imageUrl,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                res.status(500).json({ success: false, message: "Failed to create store product", error: error_4 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createStoreProduct = createStoreProduct;
// @desc    Delete a store product (Admin only)
// @route   DELETE /api/explore/store-products/:id
// @access  Private/Admin
var deleteStoreProduct = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var product, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, store_product_model_1.default.findById(req.params.id)];
            case 1:
                product = _a.sent();
                if (!product) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Product not found" })];
                }
                return [4 /*yield*/, store_product_model_1.default.findByIdAndDelete(req.params.id)];
            case 2:
                _a.sent();
                res.status(200).json({
                    success: true,
                    message: "Product deleted successfully"
                });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _a.sent();
                res.status(500).json({ success: false, message: "Failed to delete product", error: error_5 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteStoreProduct = deleteStoreProduct;
// @desc    Create an expert (Admin only)
// @route   POST /api/explore/experts
// @access  Private/Admin
var createExpert = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, name_2, specialty, fee, online, expert, error_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, name_2 = _a.name, specialty = _a.specialty, fee = _a.fee, online = _a.online;
                if (!name_2 || !specialty || fee === undefined) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Please fill in all required fields (name, specialty, fee)" })];
                }
                return [4 /*yield*/, expert_model_1.default.create({
                        name: name_2,
                        specialty: specialty,
                        fee: Number(fee),
                        online: online === true || online === "true",
                    })];
            case 1:
                expert = _b.sent();
                res.status(201).json({
                    success: true,
                    data: {
                        id: expert._id,
                        name: expert.name,
                        specialty: expert.specialty,
                        rating: expert.rating,
                        sessions: expert.sessions,
                        fee: expert.fee,
                        online: expert.online,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _b.sent();
                res.status(500).json({ success: false, message: "Failed to create expert", error: error_6 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createExpert = createExpert;
// @desc    Delete an expert (Admin only)
// @route   DELETE /api/explore/experts/:id
// @access  Private/Admin
var deleteExpert = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var expert, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, expert_model_1.default.findById(req.params.id)];
            case 1:
                expert = _a.sent();
                if (!expert) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Expert not found" })];
                }
                return [4 /*yield*/, expert_model_1.default.findByIdAndDelete(req.params.id)];
            case 2:
                _a.sent();
                res.status(200).json({
                    success: true,
                    message: "Expert deleted successfully"
                });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _a.sent();
                res.status(500).json({ success: false, message: "Failed to delete expert", error: error_7 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteExpert = deleteExpert;
// FIXED: @desc    Create an outbreak spot (Admin only)
// @route   POST /api/explore/outbreaks
// @access  Private/Admin
var createOutbreak = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, region, disease, severity, cases, trendPercent, mapX, mapY, outbreak, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, region = _a.region, disease = _a.disease, severity = _a.severity, cases = _a.cases, trendPercent = _a.trendPercent, mapX = _a.mapX, mapY = _a.mapY;
                if (!region || !disease || !severity) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Please fill in all required fields (region, disease, severity)" })];
                }
                return [4 /*yield*/, outbreak_spot_model_1.default.create({
                        region: region,
                        disease: disease,
                        severity: severity,
                        cases: Number(cases) || 0,
                        trendPercent: Number(trendPercent) || 0,
                        mapX: mapX !== undefined ? Number(mapX) : Math.random() * 0.6 + 0.2, // standard random placement coordinates fallback
                        mapY: mapY !== undefined ? Number(mapY) : Math.random() * 0.6 + 0.2,
                        colorHex: severity === "high" ? "#FF4D4D" : severity === "medium" ? "#FFA502" : "#2ED573",
                    })];
            case 1:
                outbreak = _b.sent();
                res.status(201).json({
                    success: true,
                    data: {
                        id: outbreak._id,
                        region: outbreak.region,
                        disease: outbreak.disease,
                        severity: outbreak.severity,
                        cases: outbreak.cases,
                        trendPercent: outbreak.trendPercent,
                        mapX: outbreak.mapX,
                        mapY: outbreak.mapY,
                        colorHex: outbreak.colorHex,
                    },
                });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _b.sent();
                res.status(500).json({ success: false, message: "Failed to create outbreak spot", error: error_8 });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createOutbreak = createOutbreak;
// FIXED: @desc    Delete an outbreak spot (Admin only)
// @route   DELETE /api/explore/outbreaks/:id
// @access  Private/Admin
var deleteOutbreak = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var outbreak, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, outbreak_spot_model_1.default.findById(req.params.id)];
            case 1:
                outbreak = _a.sent();
                if (!outbreak) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Outbreak spot not found" })];
                }
                return [4 /*yield*/, outbreak_spot_model_1.default.findByIdAndDelete(req.params.id)];
            case 2:
                _a.sent();
                res.status(200).json({
                    success: true,
                    message: "Outbreak spot deleted successfully"
                });
                return [3 /*break*/, 4];
            case 3:
                error_9 = _a.sent();
                res.status(500).json({ success: false, message: "Failed to delete outbreak spot", error: error_9 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.deleteOutbreak = deleteOutbreak;
// FIXED: @desc    Update an outbreak spot (Admin only)
// @route   PUT /api/explore/outbreaks/:id
// @access  Private/Admin
var updateOutbreak = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, region, disease, severity, cases, trendPercent, mapX, mapY, outbreak, error_10;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, region = _a.region, disease = _a.disease, severity = _a.severity, cases = _a.cases, trendPercent = _a.trendPercent, mapX = _a.mapX, mapY = _a.mapY;
                return [4 /*yield*/, outbreak_spot_model_1.default.findById(req.params.id)];
            case 1:
                outbreak = _b.sent();
                if (!outbreak) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Outbreak spot not found" })];
                }
                if (region !== undefined)
                    outbreak.region = region;
                if (disease !== undefined)
                    outbreak.disease = disease;
                if (severity !== undefined) {
                    if (!['high', 'medium', 'low'].includes(severity)) {
                        return [2 /*return*/, res.status(400).json({ success: false, message: "Invalid severity specified (high, medium, low)" })];
                    }
                    outbreak.severity = severity;
                    outbreak.colorHex = severity === "high" ? "#FF4D4D" : severity === "medium" ? "#FFA502" : "#2ED573";
                }
                if (cases !== undefined)
                    outbreak.cases = Number(cases);
                if (trendPercent !== undefined)
                    outbreak.trendPercent = Number(trendPercent);
                if (mapX !== undefined)
                    outbreak.mapX = Number(mapX);
                if (mapY !== undefined)
                    outbreak.mapY = Number(mapY);
                return [4 /*yield*/, outbreak.save()];
            case 2:
                _b.sent();
                res.status(200).json({
                    success: true,
                    data: {
                        id: outbreak._id,
                        region: outbreak.region,
                        disease: outbreak.disease,
                        severity: outbreak.severity,
                        cases: outbreak.cases,
                        trendPercent: outbreak.trendPercent,
                        mapX: outbreak.mapX,
                        mapY: outbreak.mapY,
                        colorHex: outbreak.colorHex,
                    },
                });
                return [3 /*break*/, 4];
            case 3:
                error_10 = _b.sent();
                res.status(500).json({ success: false, message: "Failed to update outbreak spot", error: error_10 });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateOutbreak = updateOutbreak;
