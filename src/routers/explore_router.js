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
var express_1 = require("express");
var explore_controller_1 = require("../controllers/explore_controller");
var explore_engine_controller_1 = require("../controllers/explore_engine_controller");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
var user_model_1 = __importDefault(require("../models/user_model"));
var router = (0, express_1.Router)();
var adminOrMod = (0, auth_middleware_1.authorizeRoles)('moderator', 'admin', 'super_admin');
var optionalProtect = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var token, jwtSecret, decoded, user, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!(req.headers.authorization && req.headers.authorization.startsWith("Bearer"))) return [3 /*break*/, 5];
                _a.label = 1;
            case 1:
                _a.trys.push([1, 4, , 5]);
                token = req.headers.authorization.split(' ')[1];
                jwtSecret = process.env.JWT_SECRET;
                if (!jwtSecret) return [3 /*break*/, 3];
                decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                return [4 /*yield*/, user_model_1.default.findById(decoded.id).select('-password')];
            case 2:
                user = _a.sent();
                if (user && user.status !== 'disabled' && user.tokenVersion === decoded.tokenVersion) {
                    req.user = user;
                }
                _a.label = 3;
            case 3: return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                return [3 /*break*/, 5];
            case 5:
                next();
                return [2 /*return*/];
        }
    });
}); };
// --- Unified Discovery Feed & AI Recommendations ---
router.get("/", optionalProtect, explore_engine_controller_1.getExploreFeed);
router.get("/featured", explore_engine_controller_1.getFeaturedContent);
router.get("/trending", explore_engine_controller_1.getTrendingContent);
router.post("/event", optionalProtect, explore_engine_controller_1.recordExploreEvent);
router.get("/recommendations", auth_middleware_1.protect, explore_engine_controller_1.getRecommendations);
// --- Admin explore placement config & stats ---
router.get("/admin/stats", auth_middleware_1.protect, adminOrMod, explore_engine_controller_1.getAdminExploreStats);
router.get("/admin/content", auth_middleware_1.protect, adminOrMod, explore_engine_controller_1.getAdminExplorePlacements);
router.post("/admin/content", auth_middleware_1.protect, auth_middleware_1.admin, explore_engine_controller_1.createExplorePlacement);
router.put("/admin/content/:id", auth_middleware_1.protect, auth_middleware_1.admin, explore_engine_controller_1.updateExplorePlacement);
router.delete("/admin/content/:id", auth_middleware_1.protect, auth_middleware_1.admin, explore_engine_controller_1.deleteExplorePlacement);
// --- Admin explore sections config ---
router.get("/admin/sections", auth_middleware_1.protect, adminOrMod, explore_engine_controller_1.getAdminExploreSections);
router.post("/admin/sections", auth_middleware_1.protect, auth_middleware_1.admin, explore_engine_controller_1.createExploreSection);
router.put("/admin/sections/:id", auth_middleware_1.protect, auth_middleware_1.admin, explore_engine_controller_1.updateExploreSection);
router.delete("/admin/sections/:id", auth_middleware_1.protect, auth_middleware_1.admin, explore_engine_controller_1.deleteExploreSection);
// --- Legacy Explore Catalogs (backward compatible) ---
router.get("/store-products", explore_controller_1.getStoreProducts);
router.post("/store-products", auth_middleware_1.protect, auth_middleware_1.admin, explore_controller_1.createStoreProduct);
router.delete("/store-products/:id", auth_middleware_1.protect, auth_middleware_1.admin, explore_controller_1.deleteStoreProduct);
router.get("/experts", explore_controller_1.getExperts);
router.post("/experts", auth_middleware_1.protect, auth_middleware_1.admin, explore_controller_1.createExpert);
router.delete("/experts/:id", auth_middleware_1.protect, auth_middleware_1.admin, explore_controller_1.deleteExpert);
router.get("/outbreaks", explore_controller_1.getOutbreaks);
router.post("/outbreaks", auth_middleware_1.protect, auth_middleware_1.admin, explore_controller_1.createOutbreak);
router.put("/outbreaks/:id", auth_middleware_1.protect, auth_middleware_1.admin, explore_controller_1.updateOutbreak);
router.delete("/outbreaks/:id", auth_middleware_1.protect, auth_middleware_1.admin, explore_controller_1.deleteOutbreak);
exports.default = router;
