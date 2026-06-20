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
exports.deleteAdminPlant = exports.getAdminPlants = void 0;
var my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
var api_response_1 = require("../utils/api_response");
var watering_log_model_1 = __importDefault(require("../models/watering_log_model"));
var diary_entry_model_1 = __importDefault(require("../models/diary_entry_model"));
var reminder_model_1 = __importDefault(require("../models/reminder_model"));
var diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
var my_plants_controller_1 = require("./my_plants_controller");
// @desc    Admin: Get all plants globally
// @route   GET /api/admin/my-plants
// @access  Private/Admin
var getAdminPlants = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var page, limit, skip, _a, search, healthStatus, sort, query, sortOption, total, plants, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                page = parseInt(req.query.page, 10) || 1;
                limit = parseInt(req.query.limit, 10) || 20;
                skip = (page - 1) * limit;
                _a = req.query, search = _a.search, healthStatus = _a.healthStatus, sort = _a.sort;
                query = {};
                if (search) {
                    query.$or = [
                        { name: { $regex: search, $options: "i" } },
                        { species: { $regex: search, $options: "i" } }
                    ];
                }
                if (healthStatus)
                    query.healthStatus = healthStatus;
                sortOption = { createdAt: -1 };
                if (sort === "name_asc")
                    sortOption = { name: 1 };
                if (sort === "name_desc")
                    sortOption = { name: -1 };
                return [4 /*yield*/, my_plant_model_1.default.countDocuments(query)];
            case 1:
                total = _b.sent();
                return [4 /*yield*/, my_plant_model_1.default.find(query)
                        .sort(sortOption)
                        .skip(skip)
                        .limit(limit)
                        .populate('user', 'name email')];
            case 2:
                plants = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, {
                        total: total,
                        page: page,
                        totalPages: Math.ceil(total / limit),
                        plants: plants.map(function (p) { return ({
                            id: p._id,
                            name: p.name,
                            species: p.species,
                            imageUrl: p.imageUrl,
                            location: p.location,
                            healthStatus: p.healthStatus,
                            createdAt: p.createdAt,
                            user: p.user ? { id: p.user._id, name: p.user.name, email: p.user.email } : null,
                        }); }),
                    })];
            case 3:
                error_1 = _b.sent();
                next(error_1);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); };
exports.getAdminPlants = getAdminPlants;
// @desc    Admin: Delete a plant
// @route   DELETE /api/admin/my-plants/:id
// @access  Private/Admin
var deleteAdminPlant = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var plant, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                return [4 /*yield*/, my_plant_model_1.default.findByIdAndDelete(req.params.id)];
            case 1:
                plant = _a.sent();
                if (!plant) {
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Plant not found" })];
                }
                if (!plant.imageUrl) return [3 /*break*/, 3];
                return [4 /*yield*/, (0, my_plants_controller_1.deleteCloudinaryImage)(plant.imageUrl)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [4 /*yield*/, Promise.all([
                    watering_log_model_1.default.deleteMany({ plant: plant._id }),
                    diary_entry_model_1.default.deleteMany({ plantId: plant._id }),
                    reminder_model_1.default.deleteMany({ plantId: plant._id }),
                    diagnosis_history_model_1.default.deleteMany({ plantId: plant._id }),
                ])];
            case 4:
                _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Plant deleted successfully by admin" })];
            case 5:
                error_2 = _a.sent();
                next(error_2);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.deleteAdminPlant = deleteAdminPlant;
