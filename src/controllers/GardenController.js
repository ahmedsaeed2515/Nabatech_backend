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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GardenController = void 0;
var GardenService_1 = require("../services/GardenService");
var v2_1 = require("../validation/v2");
var GardenController = /** @class */ (function () {
    function GardenController() {
        var _this = this;
        this.createGarden = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var parsed, userId, garden, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        parsed = v2_1.createGardenSchema.parse(req.body);
                        userId = req.user._id || req.user.userId;
                        return [4 /*yield*/, this.gardenService.createGarden(userId, parsed.name, parsed.type)];
                    case 1:
                        garden = _a.sent();
                        res.status(201).json({ status: 'success', data: garden });
                        return [3 /*break*/, 3];
                    case 2:
                        err_1 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_1.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.getGardens = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var userId, gardens, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        userId = req.user._id || req.user.userId;
                        return [4 /*yield*/, this.gardenService.getGardensByUser(userId)];
                    case 1:
                        gardens = _a.sent();
                        res.status(200).json({ status: 'success', data: gardens });
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_2.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.updateGarden = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var id, userId, data, garden, err_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        userId = req.user._id || req.user.userId;
                        data = req.body;
                        return [4 /*yield*/, this.gardenService.updateGarden(id, userId, data)];
                    case 1:
                        garden = _a.sent();
                        if (!garden) {
                            return [2 /*return*/, res.status(404).json({ status: 'error', message: 'Garden not found or unauthorized' })];
                        }
                        res.status(200).json({ status: 'success', data: garden });
                        return [3 /*break*/, 3];
                    case 2:
                        err_3 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_3.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.deleteGarden = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var id, userId, success, err_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        id = req.params.id;
                        userId = req.user._id || req.user.userId;
                        return [4 /*yield*/, this.gardenService.deleteGarden(id, userId)];
                    case 1:
                        success = _a.sent();
                        if (!success) {
                            return [2 /*return*/, res.status(404).json({ status: 'error', message: 'Garden not found or unauthorized' })];
                        }
                        res.status(200).json({ status: 'success', message: 'Garden deleted successfully' });
                        return [3 /*break*/, 3];
                    case 2:
                        err_4 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_4.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.gardenService = new GardenService_1.GardenService();
    }
    return GardenController;
}());
exports.GardenController = GardenController;
