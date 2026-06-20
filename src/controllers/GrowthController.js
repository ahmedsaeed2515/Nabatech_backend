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
exports.GrowthController = void 0;
var GrowthService_1 = require("../services/GrowthService");
var v2_1 = require("../validation/v2");
var cloudinary_1 = __importDefault(require("../config/cloudinary"));
var GrowthController = /** @class */ (function () {
    function GrowthController() {
        var _this = this;
        this.logMeasurement = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var rawId, id, userId, parsed, photoUrl, b64, dataURI, result, measurement, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 4, , 5]);
                        rawId = req.params.id;
                        id = Array.isArray(rawId) ? rawId[0] : rawId;
                        userId = req.user._id || req.user.userId;
                        parsed = v2_1.growthMeasurementSchema.parse(req.body);
                        photoUrl = undefined;
                        if (!req.file) return [3 /*break*/, 2];
                        b64 = Buffer.from(req.file.buffer).toString('base64');
                        dataURI = "data:".concat(req.file.mimetype, ";base64,").concat(b64);
                        return [4 /*yield*/, cloudinary_1.default.uploader.upload(dataURI, {
                                folder: 'nabatech/growth',
                            })];
                    case 1:
                        result = _a.sent();
                        photoUrl = result.secure_url;
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.growthService.logMeasurement(id, userId, {
                            heightCm: parsed.heightCm,
                            leafCount: parsed.leafCount,
                            stage: parsed.stage,
                            photoUrl: photoUrl
                        })];
                    case 3:
                        measurement = _a.sent();
                        res.status(201).json({ status: 'success', data: measurement });
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_1.message });
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        }); };
        this.getTimeline = function (req, res) { return __awaiter(_this, void 0, void 0, function () {
            var rawId, id, userId, timeline, err_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        rawId = req.params.id;
                        id = Array.isArray(rawId) ? rawId[0] : rawId;
                        userId = req.user._id || req.user.userId;
                        return [4 /*yield*/, this.growthService.getTimeline(id, userId)];
                    case 1:
                        timeline = _a.sent();
                        res.status(200).json({ status: 'success', data: timeline });
                        return [3 /*break*/, 3];
                    case 2:
                        err_2 = _a.sent();
                        res.status(400).json({ status: 'error', message: err_2.message });
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        }); };
        this.growthService = new GrowthService_1.GrowthService();
    }
    return GrowthController;
}());
exports.GrowthController = GrowthController;
