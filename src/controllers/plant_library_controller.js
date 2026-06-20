"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
exports.bulkImport = exports.deleteDisease = exports.updateDisease = exports.addDisease = exports.getDiseases = exports.exportPlants = exports.getPlantStats = exports.searchPlants = exports.publishPlant = exports.archivePlant = exports.getPlantById = exports.deletePlant = exports.updatePlant = exports.addPlant = exports.adminSearchPlants = exports.getPlants = void 0;
var plant_model_1 = __importDefault(require("../models/plant_model"));
var disease_model_1 = __importDefault(require("../models/disease_model"));
var logger_1 = __importDefault(require("../logger"));
// ==========================================
// Plants Controllers
// ==========================================
// @desc    Get all plants
// @route   GET /api/plant-library/plants
// @access  Public
var getPlants = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, search, category, cursor, _b, limit, limitNumber, query, normalized, cursorQuery, plants, hasNextPage, items, nextCursor, totalCount, error_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                logger_1.default.info({ event: "plant_library.getPlants", query: req.query });
                _a = req.query, search = _a.search, category = _a.category, cursor = _a.cursor, _b = _a.limit, limit = _b === void 0 ? "20" : _b;
                limitNumber = Math.min(parseInt(limit, 10) || 20, 100);
                query = { isLibraryItem: true };
                if (search) {
                    normalized = search.toLowerCase().trim();
                    // Prefix search on normalized fields, fallback to regex on original fields
                    query.$or = [
                        { normalizedNameEn: { $regex: "^".concat(normalized) } },
                        { normalizedNameAr: { $regex: "^".concat(normalized) } },
                        { nameEn: { $regex: search, $options: "i" } },
                        { nameAr: { $regex: search, $options: "i" } },
                    ];
                }
                if (category) {
                    query.category = category;
                }
                cursorQuery = {};
                if (cursor) {
                    cursorQuery._id = { $gt: cursor };
                }
                return [4 /*yield*/, plant_model_1.default.find(__assign(__assign({}, query), cursorQuery))
                        .sort({ _id: 1 })
                        .limit(limitNumber + 1)];
            case 1:
                plants = _c.sent();
                hasNextPage = plants.length > limitNumber;
                items = hasNextPage ? plants.slice(0, -1) : plants;
                nextCursor = hasNextPage ? items[items.length - 1]._id : null;
                return [4 /*yield*/, plant_model_1.default.countDocuments(query)];
            case 2:
                totalCount = _c.sent();
                res.status(200).json({
                    success: true,
                    data: { items: items, pageInfo: { hasNextPage: hasNextPage, nextCursor: nextCursor } },
                    count: totalCount,
                    totalPages: Math.ceil(totalCount / limitNumber),
                });
                return [3 /*break*/, 4];
            case 3:
                error_1 = _c.sent();
                res.status(500).json({ success: false, message: error_1.message || "Failed to fetch plants" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getPlants = getPlants;
// @desc    Search plants by wildcard text
// @route   GET /api/v1/admin/plants/search
// @access  Admin
var adminSearchPlants = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, q, cursor, _b, limit, limitNumber, query, search, cursorQuery, plants, hasNextPage, items, nextCursor, totalCount, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                _a = req.query, q = _a.q, cursor = _a.cursor, _b = _a.limit, limit = _b === void 0 ? "20" : _b;
                limitNumber = Math.min(parseInt(limit, 10) || 20, 100);
                query = { isLibraryItem: true };
                if (q) {
                    search = q.trim();
                    query.$or = [
                        { species: { $regex: search, $options: "i" } },
                        { scientificName: { $regex: search, $options: "i" } },
                        { descriptionEn: { $regex: search, $options: "i" } },
                        { nameEn: { $regex: search, $options: "i" } },
                        { nameAr: { $regex: search, $options: "i" } }
                    ];
                }
                cursorQuery = {};
                if (cursor) {
                    cursorQuery._id = { $gt: cursor };
                }
                return [4 /*yield*/, plant_model_1.default.find(__assign(__assign({}, query), cursorQuery))
                        .sort({ _id: 1 })
                        .limit(limitNumber + 1)];
            case 1:
                plants = _c.sent();
                hasNextPage = plants.length > limitNumber;
                items = hasNextPage ? plants.slice(0, -1) : plants;
                nextCursor = hasNextPage ? items[items.length - 1]._id : null;
                return [4 /*yield*/, plant_model_1.default.countDocuments(query)];
            case 2:
                totalCount = _c.sent();
                res.status(200).json({
                    success: true,
                    data: { items: items, pageInfo: { hasNextPage: hasNextPage, nextCursor: nextCursor } },
                    count: totalCount,
                    totalPages: Math.ceil(totalCount / limitNumber),
                });
                return [3 /*break*/, 4];
            case 3:
                error_2 = _c.sent();
                res.status(500).json({ success: false, message: error_2.message || "Failed to search plants" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.adminSearchPlants = adminSearchPlants;
// @desc    Add new plant
// @route   POST /api/plant-library/plants
// @access  Admin
var addPlant = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, nameAr, nameEn, scientificName, imageUrl, category, careLevel, descriptionAr, descriptionEn, waterRequirements, lightRequirements, humidityRequirements, soilRequirements, fertilizerRequirements, growthRate, matureSize, temperatureRange, toxicityLevel, wateringFrequency, careInstructions, commonProblems, propagationMethod, nativeRegion, plantBenefits, slug, existing, plant, error_3;
    var _b, _c;
    return __generator(this, function (_d) {
        switch (_d.label) {
            case 0:
                _d.trys.push([0, 3, , 4]);
                logger_1.default.info({ event: "plant_library.addPlant", body: req.body, user: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id });
                _a = req.body, nameAr = _a.nameAr, nameEn = _a.nameEn, scientificName = _a.scientificName, imageUrl = _a.imageUrl, category = _a.category, careLevel = _a.careLevel, descriptionAr = _a.descriptionAr, descriptionEn = _a.descriptionEn, waterRequirements = _a.waterRequirements, lightRequirements = _a.lightRequirements, humidityRequirements = _a.humidityRequirements, soilRequirements = _a.soilRequirements, fertilizerRequirements = _a.fertilizerRequirements, growthRate = _a.growthRate, matureSize = _a.matureSize, temperatureRange = _a.temperatureRange, toxicityLevel = _a.toxicityLevel, wateringFrequency = _a.wateringFrequency, careInstructions = _a.careInstructions, commonProblems = _a.commonProblems, propagationMethod = _a.propagationMethod, nativeRegion = _a.nativeRegion, plantBenefits = _a.plantBenefits;
                if (!nameAr || !nameEn) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "nameAr and nameEn are required fields" })];
                }
                slug = nameEn.toLowerCase().replace(/\s+/g, '-');
                return [4 /*yield*/, plant_model_1.default.findOne({ slug: slug })];
            case 1:
                existing = _d.sent();
                if (existing) {
                    return [2 /*return*/, res.status(409).json({ success: false, message: "Plant with this slug already exists" })];
                }
                return [4 /*yield*/, plant_model_1.default.create({
                        nameAr: nameAr,
                        nameEn: nameEn,
                        scientificName: scientificName,
                        imageUrl: imageUrl,
                        category: category,
                        careLevel: careLevel,
                        descriptionAr: descriptionAr,
                        descriptionEn: descriptionEn,
                        waterRequirements: waterRequirements,
                        lightRequirements: lightRequirements,
                        humidityRequirements: humidityRequirements,
                        soilRequirements: soilRequirements,
                        fertilizerRequirements: fertilizerRequirements,
                        growthRate: growthRate,
                        matureSize: matureSize,
                        temperatureRange: temperatureRange,
                        toxicityLevel: toxicityLevel,
                        wateringFrequency: wateringFrequency,
                        careInstructions: careInstructions,
                        commonProblems: commonProblems,
                        propagationMethod: propagationMethod,
                        nativeRegion: nativeRegion,
                        plantBenefits: plantBenefits,
                        slug: slug,
                        normalizedNameEn: nameEn.toLowerCase(),
                        normalizedNameAr: nameAr.toLowerCase(),
                        active: true,
                        createdBy: ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id) || '',
                        isLibraryItem: true,
                    })];
            case 2:
                plant = _d.sent();
                res.status(201).json({ success: true, data: plant });
                return [3 /*break*/, 4];
            case 3:
                error_3 = _d.sent();
                res.status(500).json({ success: false, message: error_3.message || "Failed to create plant" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.addPlant = addPlant;
// @desc    Update plant details
// @route   PUT /api/plant-library/plants/:id
// @access  Admin
var updatePlant = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, nameAr, nameEn, scientificName, imageUrl, category, careLevel, descriptionAr, descriptionEn, waterRequirements, lightRequirements, humidityRequirements, soilRequirements, fertilizerRequirements, growthRate, matureSize, temperatureRange, toxicityLevel, wateringFrequency, careInstructions, commonProblems, propagationMethod, nativeRegion, plantBenefits, plant, error_4;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                logger_1.default.info({ event: "plant_library.updatePlant", params: req.params, body: req.body, user: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id });
                id = req.params.id;
                _a = req.body, nameAr = _a.nameAr, nameEn = _a.nameEn, scientificName = _a.scientificName, imageUrl = _a.imageUrl, category = _a.category, careLevel = _a.careLevel, descriptionAr = _a.descriptionAr, descriptionEn = _a.descriptionEn, waterRequirements = _a.waterRequirements, lightRequirements = _a.lightRequirements, humidityRequirements = _a.humidityRequirements, soilRequirements = _a.soilRequirements, fertilizerRequirements = _a.fertilizerRequirements, growthRate = _a.growthRate, matureSize = _a.matureSize, temperatureRange = _a.temperatureRange, toxicityLevel = _a.toxicityLevel, wateringFrequency = _a.wateringFrequency, careInstructions = _a.careInstructions, commonProblems = _a.commonProblems, propagationMethod = _a.propagationMethod, nativeRegion = _a.nativeRegion, plantBenefits = _a.plantBenefits;
                return [4 /*yield*/, plant_model_1.default.findById(id)];
            case 1:
                plant = _c.sent();
                if (!plant) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Plant not found" })];
                }
                if (nameAr !== undefined)
                    plant.nameAr = nameAr;
                if (nameEn !== undefined)
                    plant.nameEn = nameEn;
                if (scientificName !== undefined)
                    plant.scientificName = scientificName;
                if (imageUrl !== undefined)
                    plant.imageUrl = imageUrl;
                if (category !== undefined)
                    plant.category = category;
                if (careLevel !== undefined)
                    plant.careLevel = careLevel;
                if (descriptionAr !== undefined)
                    plant.descriptionAr = descriptionAr;
                if (descriptionEn !== undefined)
                    plant.descriptionEn = descriptionEn;
                if (waterRequirements !== undefined)
                    plant.waterRequirements = waterRequirements;
                if (lightRequirements !== undefined)
                    plant.lightRequirements = lightRequirements;
                if (humidityRequirements !== undefined)
                    plant.humidityRequirements = humidityRequirements;
                if (soilRequirements !== undefined)
                    plant.soilRequirements = soilRequirements;
                if (fertilizerRequirements !== undefined)
                    plant.fertilizerRequirements = fertilizerRequirements;
                if (growthRate !== undefined)
                    plant.growthRate = growthRate;
                if (matureSize !== undefined)
                    plant.matureSize = matureSize;
                if (temperatureRange !== undefined)
                    plant.temperatureRange = temperatureRange;
                if (toxicityLevel !== undefined)
                    plant.toxicityLevel = toxicityLevel;
                if (wateringFrequency !== undefined)
                    plant.wateringFrequency = wateringFrequency;
                if (careInstructions !== undefined)
                    plant.careInstructions = careInstructions;
                if (commonProblems !== undefined)
                    plant.commonProblems = commonProblems;
                if (propagationMethod !== undefined)
                    plant.propagationMethod = propagationMethod;
                if (nativeRegion !== undefined)
                    plant.nativeRegion = nativeRegion;
                if (plantBenefits !== undefined)
                    plant.plantBenefits = plantBenefits;
                return [4 /*yield*/, plant.save()];
            case 2:
                _c.sent();
                res.status(200).json({ success: true, data: plant });
                return [3 /*break*/, 4];
            case 3:
                error_4 = _c.sent();
                res.status(500).json({ success: false, message: error_4.message || "Failed to update plant" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updatePlant = updatePlant;
// @desc    Delete plant
// @route   DELETE /api/plant-library/plants/:id
// @access  Admin
var deletePlant = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, plant, error_5;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                logger_1.default.info({ event: "plant_library.deletePlant", params: req.params, user: (_a = req.user) === null || _a === void 0 ? void 0 : _a.id });
                id = req.params.id;
                return [4 /*yield*/, plant_model_1.default.findByIdAndDelete(id)];
            case 1:
                plant = _b.sent();
                if (!plant) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Plant not found" })];
                }
                res.status(200).json({ success: true, message: "Plant deleted successfully" });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _b.sent();
                res.status(500).json({ success: false, message: error_5.message || "Failed to delete plant" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deletePlant = deletePlant;
// @desc    Get plant by id
// @route   GET /api/plant-library/plants/:id
// @access  Public
var getPlantById = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, plant, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, plant_model_1.default.findById(id).populate('tags diseases seasons')];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Plant not found" })];
                }
                res.status(200).json({ success: true, data: plant });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                res.status(500).json({ success: false, message: error_6.message || "Failed to fetch plant" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getPlantById = getPlantById;
// @desc    Archive plant
// @route   PATCH /api/plant-library/plants/:id/archive
// @access  Admin
var archivePlant = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, plant, error_7;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, plant_model_1.default.findByIdAndUpdate(id, { status: 'ARCHIVED' }, { new: true })];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Plant not found" })];
                }
                res.status(200).json({ success: true, data: plant });
                return [3 /*break*/, 3];
            case 2:
                error_7 = _a.sent();
                res.status(500).json({ success: false, message: error_7.message || "Failed to archive plant" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.archivePlant = archivePlant;
// @desc    Publish plant
// @route   PATCH /api/plant-library/plants/:id/publish
// @access  Admin
var publishPlant = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, plant, error_8;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, plant_model_1.default.findByIdAndUpdate(id, { status: 'PUBLISHED' }, { new: true })];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Plant not found" })];
                }
                res.status(200).json({ success: true, data: plant });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _a.sent();
                res.status(500).json({ success: false, message: error_8.message || "Failed to publish plant" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.publishPlant = publishPlant;
// @desc    Search plants (dedicated search endpoint)
// @route   GET /api/plant-library/plants/search
// @access  Public
var searchPlants = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, q, _b, limit, limitNumber, normalized, query, plants, error_9;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                _a = req.query, q = _a.q, _b = _a.limit, limit = _b === void 0 ? "10" : _b;
                if (!q) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "Search query 'q' is required" })];
                }
                limitNumber = Math.min(parseInt(limit, 10) || 10, 50);
                normalized = q.toLowerCase().trim();
                query = {
                    isLibraryItem: true,
                    status: 'PUBLISHED',
                    $or: [
                        { normalizedNameEn: { $regex: "^".concat(normalized) } },
                        { normalizedNameAr: { $regex: "^".concat(normalized) } },
                        { nameEn: { $regex: q, $options: "i" } },
                        { nameAr: { $regex: q, $options: "i" } },
                    ]
                };
                return [4 /*yield*/, plant_model_1.default.find(query).limit(limitNumber).select('nameAr nameEn imageUrl category slug')];
            case 1:
                plants = _c.sent();
                res.status(200).json({ success: true, data: plants });
                return [3 /*break*/, 3];
            case 2:
                error_9 = _c.sent();
                res.status(500).json({ success: false, message: error_9.message || "Failed to search plants" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.searchPlants = searchPlants;
// @desc    Get plant stats
// @route   GET /api/plant-library/plants/stats
// @access  Admin
var getPlantStats = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var totalCount, publishedCount, draftCount, archivedCount, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, plant_model_1.default.countDocuments({ isLibraryItem: true })];
            case 1:
                totalCount = _a.sent();
                return [4 /*yield*/, plant_model_1.default.countDocuments({ isLibraryItem: true, status: 'PUBLISHED' })];
            case 2:
                publishedCount = _a.sent();
                return [4 /*yield*/, plant_model_1.default.countDocuments({ isLibraryItem: true, status: 'DRAFT' })];
            case 3:
                draftCount = _a.sent();
                return [4 /*yield*/, plant_model_1.default.countDocuments({ isLibraryItem: true, status: 'ARCHIVED' })];
            case 4:
                archivedCount = _a.sent();
                res.status(200).json({
                    success: true,
                    data: { totalCount: totalCount, publishedCount: publishedCount, draftCount: draftCount, archivedCount: archivedCount }
                });
                return [3 /*break*/, 6];
            case 5:
                error_10 = _a.sent();
                res.status(500).json({ success: false, message: error_10.message || "Failed to fetch stats" });
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.getPlantStats = getPlantStats;
// @desc    Export plants
// @route   GET /api/plant-library/plants/export
// @access  Admin
var exportPlants = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var plants, error_11;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, plant_model_1.default.find({ isLibraryItem: true }).lean()];
            case 1:
                plants = _a.sent();
                res.status(200).json({ success: true, data: plants });
                return [3 /*break*/, 3];
            case 2:
                error_11 = _a.sent();
                res.status(500).json({ success: false, message: error_11.message || "Failed to export plants" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.exportPlants = exportPlants;
// ==========================================
// Diseases Controllers
// ==========================================
// @desc    Get all diseases
// @route   GET /api/plant-library/diseases
// @access  Public
var getDiseases = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, search, type, cursor, _b, limit, limitNumber, query, normalized, cursorQuery, diseases, hasNextPage, items, nextCursor, totalCount, error_12;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                logger_1.default.info({ event: "plant_library.getDiseases", query: req.query });
                _a = req.query, search = _a.search, type = _a.type, cursor = _a.cursor, _b = _a.limit, limit = _b === void 0 ? "20" : _b;
                limitNumber = Math.min(parseInt(limit, 10) || 20, 100);
                query = {};
                if (search) {
                    normalized = search.toLowerCase().trim();
                    query.$or = [
                        { normalizedNameEn: { $regex: "^".concat(normalized) } },
                        { normalizedNameAr: { $regex: "^".concat(normalized) } },
                        { nameEn: { $regex: search, $options: "i" } },
                        { nameAr: { $regex: search, $options: "i" } },
                    ];
                }
                if (type) {
                    query.type = type;
                }
                cursorQuery = {};
                if (cursor) {
                    cursorQuery._id = { $gt: cursor };
                }
                return [4 /*yield*/, disease_model_1.default.find(__assign(__assign({}, query), cursorQuery))
                        .sort({ _id: 1 })
                        .limit(limitNumber + 1)];
            case 1:
                diseases = _c.sent();
                hasNextPage = diseases.length > limitNumber;
                items = hasNextPage ? diseases.slice(0, -1) : diseases;
                nextCursor = hasNextPage ? items[items.length - 1]._id : null;
                return [4 /*yield*/, disease_model_1.default.countDocuments(query)];
            case 2:
                totalCount = _c.sent();
                res.status(200).json({
                    success: true,
                    data: { items: items, pageInfo: { hasNextPage: hasNextPage, nextCursor: nextCursor } },
                    count: totalCount,
                    totalPages: Math.ceil(totalCount / limitNumber),
                });
                return [3 /*break*/, 4];
            case 3:
                error_12 = _c.sent();
                res.status(500).json({ success: false, message: error_12.message || "Failed to fetch diseases" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getDiseases = getDiseases;
// @desc    Add new disease
// @route   POST /api/plant-library/diseases
// @access  Admin
var addDisease = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, nameAr, nameEn, imageUrl, severity, type, affectedPlantsCount, descriptionAr, descriptionEn, disease, error_13;
    var _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 2, , 3]);
                logger_1.default.info({ event: "plant_library.addDisease", body: req.body, user: (_b = req.user) === null || _b === void 0 ? void 0 : _b.id });
                _a = req.body, nameAr = _a.nameAr, nameEn = _a.nameEn, imageUrl = _a.imageUrl, severity = _a.severity, type = _a.type, affectedPlantsCount = _a.affectedPlantsCount, descriptionAr = _a.descriptionAr, descriptionEn = _a.descriptionEn;
                if (!nameAr || !nameEn) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: "nameAr and nameEn are required fields" })];
                }
                return [4 /*yield*/, disease_model_1.default.create({
                        nameAr: nameAr,
                        nameEn: nameEn,
                        imageUrl: imageUrl,
                        severity: severity,
                        type: type,
                        affectedPlantsCount: affectedPlantsCount,
                        descriptionAr: descriptionAr,
                        descriptionEn: descriptionEn,
                    })];
            case 1:
                disease = _c.sent();
                res.status(201).json({ success: true, data: disease });
                return [3 /*break*/, 3];
            case 2:
                error_13 = _c.sent();
                res.status(500).json({ success: false, message: error_13.message || "Failed to create disease" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.addDisease = addDisease;
// @desc    Update disease details
// @route   PUT /api/plant-library/diseases/:id
// @access  Admin
var updateDisease = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, _a, nameAr, nameEn, imageUrl, severity, type, affectedPlantsCount, descriptionAr, descriptionEn, disease, error_14;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                id = req.params.id;
                _a = req.body, nameAr = _a.nameAr, nameEn = _a.nameEn, imageUrl = _a.imageUrl, severity = _a.severity, type = _a.type, affectedPlantsCount = _a.affectedPlantsCount, descriptionAr = _a.descriptionAr, descriptionEn = _a.descriptionEn;
                return [4 /*yield*/, disease_model_1.default.findById(id)];
            case 1:
                disease = _b.sent();
                if (!disease) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Disease not found" })];
                }
                if (nameAr !== undefined)
                    disease.nameAr = nameAr;
                if (nameEn !== undefined)
                    disease.nameEn = nameEn;
                if (imageUrl !== undefined)
                    disease.imageUrl = imageUrl;
                if (severity !== undefined)
                    disease.severity = severity;
                if (type !== undefined)
                    disease.type = type;
                if (affectedPlantsCount !== undefined)
                    disease.affectedPlantsCount = affectedPlantsCount;
                if (descriptionAr !== undefined)
                    disease.descriptionAr = descriptionAr;
                if (descriptionEn !== undefined)
                    disease.descriptionEn = descriptionEn;
                return [4 /*yield*/, disease.save()];
            case 2:
                _b.sent();
                res.status(200).json({ success: true, data: disease });
                return [3 /*break*/, 4];
            case 3:
                error_14 = _b.sent();
                res.status(500).json({ success: false, message: error_14.message || "Failed to update disease" });
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.updateDisease = updateDisease;
// @desc    Delete disease
// @route   DELETE /api/plant-library/diseases/:id
// @access  Admin
var deleteDisease = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var id, disease, error_15;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                id = req.params.id;
                return [4 /*yield*/, disease_model_1.default.findByIdAndDelete(id)];
            case 1:
                disease = _a.sent();
                if (!disease) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Disease not found" })];
                }
                res.status(200).json({ success: true, message: "Disease deleted successfully" });
                return [3 /*break*/, 3];
            case 2:
                error_15 = _a.sent();
                res.status(500).json({ success: false, message: error_15.message || "Failed to delete disease" });
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteDisease = deleteDisease;
var bulkImport = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, kind, rows, idempotencyKey, existing, accepted, rejected, created, updated, errors, i, row, PlantImportRowSchema, slug, normalizedNameEn, normalizedNameAr, existingDoc, createdDoc, DiseaseImportRowSchema, slug, normalizedNameEn, normalizedNameAr, existingDoc, createdDoc, rowErr_1, response, err_1;
    var _b, _c, _d, _e, _f;
    return __generator(this, function (_g) {
        switch (_g.label) {
            case 0:
                _g.trys.push([0, 21, , 22]);
                _a = req.body, kind = _a.kind, rows = _a.rows;
                idempotencyKey = req.header('Idempotency-Key');
                if (!idempotencyKey) {
                    return [2 /*return*/, res.status(400).json({ success: false, message: 'Idempotency-Key header required' })];
                }
                existing = (_b = global.__importIdempotency) === null || _b === void 0 ? void 0 : _b[idempotencyKey];
                if (existing) {
                    return [2 /*return*/, res.status(200).json(existing)];
                }
                accepted = [];
                rejected = [];
                created = [];
                updated = [];
                errors = [];
                i = 0;
                _g.label = 1;
            case 1:
                if (!(i < rows.length)) return [3 /*break*/, 20];
                row = rows[i];
                _g.label = 2;
            case 2:
                _g.trys.push([2, 18, , 19]);
                if (!(kind === 'plants')) return [3 /*break*/, 9];
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../validation/plant_library_schemas')); })];
            case 3:
                PlantImportRowSchema = (_g.sent()).PlantImportRowSchema;
                PlantImportRowSchema.parse(row);
                slug = row.slug || row.nameEn.toLowerCase().replace(/\s+/g, '-');
                normalizedNameEn = row.nameEn.toLowerCase();
                normalizedNameAr = row.nameAr.toLowerCase();
                return [4 /*yield*/, plant_model_1.default.findOne({ slug: slug })];
            case 4:
                existingDoc = _g.sent();
                if (!existingDoc) return [3 /*break*/, 6];
                Object.assign(existingDoc, __assign(__assign({}, row), { slug: slug, normalizedNameEn: normalizedNameEn, normalizedNameAr: normalizedNameAr, updatedBy: ((_c = req.user) === null || _c === void 0 ? void 0 : _c.id) || '' }));
                return [4 /*yield*/, existingDoc.save()];
            case 5:
                _g.sent();
                updated.push(existingDoc);
                return [3 /*break*/, 8];
            case 6: return [4 /*yield*/, plant_model_1.default.create(__assign(__assign({}, row), { slug: slug, normalizedNameEn: normalizedNameEn, normalizedNameAr: normalizedNameAr, createdBy: ((_d = req.user) === null || _d === void 0 ? void 0 : _d.id) || '' }))];
            case 7:
                createdDoc = _g.sent();
                created.push(createdDoc);
                _g.label = 8;
            case 8:
                accepted.push(row);
                return [3 /*break*/, 17];
            case 9:
                if (!(kind === 'diseases')) return [3 /*break*/, 16];
                return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('../validation/plant_library_schemas')); })];
            case 10:
                DiseaseImportRowSchema = (_g.sent()).DiseaseImportRowSchema;
                DiseaseImportRowSchema.parse(row);
                slug = row.slug || row.nameEn.toLowerCase().replace(/\s+/g, '-');
                normalizedNameEn = row.nameEn.toLowerCase();
                normalizedNameAr = row.nameAr.toLowerCase();
                return [4 /*yield*/, disease_model_1.default.findOne({ slug: slug })];
            case 11:
                existingDoc = _g.sent();
                if (!existingDoc) return [3 /*break*/, 13];
                Object.assign(existingDoc, __assign(__assign({}, row), { slug: slug, normalizedNameEn: normalizedNameEn, normalizedNameAr: normalizedNameAr, updatedBy: ((_e = req.user) === null || _e === void 0 ? void 0 : _e.id) || '' }));
                return [4 /*yield*/, existingDoc.save()];
            case 12:
                _g.sent();
                updated.push(existingDoc);
                return [3 /*break*/, 15];
            case 13: return [4 /*yield*/, disease_model_1.default.create(__assign(__assign({}, row), { slug: slug, normalizedNameEn: normalizedNameEn, normalizedNameAr: normalizedNameAr, createdBy: ((_f = req.user) === null || _f === void 0 ? void 0 : _f.id) || '' }))];
            case 14:
                createdDoc = _g.sent();
                created.push(createdDoc);
                _g.label = 15;
            case 15:
                accepted.push(row);
                return [3 /*break*/, 17];
            case 16: throw new Error('Invalid kind');
            case 17: return [3 /*break*/, 19];
            case 18:
                rowErr_1 = _g.sent();
                rejected.push(row);
                errors.push({ row: row, error: rowErr_1.message });
                return [3 /*break*/, 19];
            case 19:
                i++;
                return [3 /*break*/, 1];
            case 20:
                response = { success: true, data: { accepted: accepted, rejected: rejected, created: created, updated: updated, errors: errors } };
                global.__importIdempotency = global.__importIdempotency || {};
                global.__importIdempotency[idempotencyKey] = response;
                res.status(200).json(response);
                return [3 /*break*/, 22];
            case 21:
                err_1 = _g.sent();
                res.status(500).json({ success: false, message: err_1.message || 'Bulk import failed' });
                return [3 /*break*/, 22];
            case 22: return [2 /*return*/];
        }
    });
}); };
exports.bulkImport = bulkImport;
