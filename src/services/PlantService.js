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
exports.PlantService = void 0;
var PlantRepository_1 = require("../repositories/PlantRepository");
var plant_model_1 = require("../models/plant_model");
var mongoose_1 = __importDefault(require("mongoose"));
var PlantService = /** @class */ (function () {
    function PlantService() {
        this.plantRepo = new PlantRepository_1.PlantRepository();
    }
    PlantService.prototype.createPlant = function (userId, zoneId, dnaId, name) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.plantRepo.create({
                        user: new mongoose_1.default.Types.ObjectId(userId),
                        zone: new mongoose_1.default.Types.ObjectId(zoneId),
                        dna: new mongoose_1.default.Types.ObjectId(dnaId),
                        name: name,
                        stage: plant_model_1.PlantStage.SEED,
                        healthScore: 100
                    })];
            });
        });
    };
    PlantService.prototype.getPlantDetails = function (plantId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.plantRepo.findOne({ _id: plantId, user: userId })];
            });
        });
    };
    PlantService.prototype.getPlantsByUser = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.plantRepo.findByUserId(userId)];
            });
        });
    };
    PlantService.prototype.getPlantsByZone = function (zoneId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.plantRepo.findByZoneId(zoneId, userId)];
            });
        });
    };
    PlantService.prototype.searchPlants = function (query, options) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.plantRepo.searchPlants(query, options.limit)];
            });
        });
    };
    PlantService.prototype.deletePlant = function (plantId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var plant;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.plantRepo.findOne({ _id: plantId, user: userId })];
                    case 1:
                        plant = _a.sent();
                        if (!plant)
                            return [2 /*return*/, false];
                        return [4 /*yield*/, this.plantRepo.hardDelete(plantId)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, true];
                }
            });
        });
    };
    return PlantService;
}());
exports.PlantService = PlantService;
