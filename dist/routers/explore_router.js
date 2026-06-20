"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const explore_controller_1 = require("../controllers/explore_controller");
const explore_engine_controller_1 = require("../controllers/explore_engine_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const user_model_1 = __importDefault(require("../models/user_model"));
const router = (0, express_1.Router)();
const adminOrMod = (0, auth_middleware_1.authorizeRoles)('moderator', 'admin', 'super_admin');
const optionalProtect = async (req, res, next) => {
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const jwtSecret = process.env.JWT_SECRET;
            if (jwtSecret) {
                const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
                const user = await user_model_1.default.findById(decoded.id).select('-password');
                if (user && user.status !== 'disabled' && user.tokenVersion === decoded.tokenVersion) {
                    req.user = user;
                }
            }
        }
        catch (error) {
            // Fail silently and proceed as guest
        }
    }
    next();
};
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
