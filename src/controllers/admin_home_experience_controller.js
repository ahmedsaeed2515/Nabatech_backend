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
exports.getHomeAnalytics = exports.deleteSection = exports.updateSection = exports.createSection = exports.getSections = exports.deleteQuickAction = exports.updateQuickAction = exports.createQuickAction = exports.getQuickActions = exports.deleteBanner = exports.updateBanner = exports.createBanner = exports.getBanners = exports.deleteWidget = exports.updateWidget = exports.createWidget = exports.getWidgets = void 0;
var home_widget_model_1 = __importDefault(require("../models/home_widget_model"));
var home_banner_model_1 = __importDefault(require("../models/home_banner_model"));
var home_quick_action_model_1 = __importDefault(require("../models/home_quick_action_model"));
var home_section_model_1 = __importDefault(require("../models/home_section_model"));
var home_analytics_model_1 = __importDefault(require("../models/home_analytics_model"));
var api_response_1 = require("../utils/api_response");
// --- Generic CRUD Helper ---
var getGeneric = function (Model) { return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var items, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Model.find().sort({ order: 1, defaultOrder: 1, priority: -1, createdAt: -1 })];
            case 1:
                items = _a.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { items: items })];
            case 2:
                error_1 = _a.sent();
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }; };
var createGeneric = function (Model) { return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var item, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Model.create(req.body)];
            case 1:
                item = _a.sent();
                return [2 /*return*/, res.status(201).json({ success: true, item: item })];
            case 2:
                error_2 = _a.sent();
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }; };
var updateGeneric = function (Model) { return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var item, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Model.findByIdAndUpdate(req.params.id, req.body, { new: true })];
            case 1:
                item = _a.sent();
                if (!item)
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Not found" })];
                return [2 /*return*/, (0, api_response_1.ok)(res, { item: item })];
            case 2:
                error_3 = _a.sent();
                next(error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }; };
var deleteGeneric = function (Model) { return function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var item, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, Model.findByIdAndDelete(req.params.id)];
            case 1:
                item = _a.sent();
                if (!item)
                    return [2 /*return*/, res.status(404).json({ success: false, message: "Not found" })];
                return [2 /*return*/, (0, api_response_1.ok)(res, { message: "Deleted successfully" })];
            case 2:
                error_4 = _a.sent();
                next(error_4);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); }; };
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
var getHomeAnalytics = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, from, to, type, match, views, clicks, performance_1, error_5;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 4, , 5]);
                _a = req.query, from = _a.from, to = _a.to, type = _a.type;
                match = {};
                if (type)
                    match.entityType = type;
                if (from || to) {
                    match.createdAt = {};
                    if (from)
                        match.createdAt.$gte = new Date(from);
                    if (to)
                        match.createdAt.$lte = new Date(to);
                }
                return [4 /*yield*/, home_analytics_model_1.default.countDocuments(__assign(__assign({}, match), { eventType: "view" }))];
            case 1:
                views = _b.sent();
                return [4 /*yield*/, home_analytics_model_1.default.countDocuments(__assign(__assign({}, match), { eventType: "click" }))];
            case 2:
                clicks = _b.sent();
                return [4 /*yield*/, home_analytics_model_1.default.aggregate([
                        { $match: match },
                        { $group: {
                                _id: { entityId: "$entityId", eventType: "$eventType" },
                                count: { $sum: 1 }
                            } },
                    ])];
            case 3:
                performance_1 = _b.sent();
                return [2 /*return*/, (0, api_response_1.ok)(res, { views: views, clicks: clicks, performance: performance_1 })];
            case 4:
                error_5 = _b.sent();
                next(error_5);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.getHomeAnalytics = getHomeAnalytics;
