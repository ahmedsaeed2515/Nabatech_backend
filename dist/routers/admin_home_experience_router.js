"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_home_experience_controller_1 = require("../controllers/admin_home_experience_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)("super_admin", "admin", "staff"));
// Widgets
router.get("/widgets", admin_home_experience_controller_1.getWidgets);
router.post("/widgets", admin_home_experience_controller_1.createWidget);
router.put("/widgets/:id", admin_home_experience_controller_1.updateWidget);
router.delete("/widgets/:id", admin_home_experience_controller_1.deleteWidget);
// Banners
router.get("/banners", admin_home_experience_controller_1.getBanners);
router.post("/banners", admin_home_experience_controller_1.createBanner);
router.put("/banners/:id", admin_home_experience_controller_1.updateBanner);
router.delete("/banners/:id", admin_home_experience_controller_1.deleteBanner);
// Quick Actions
router.get("/actions", admin_home_experience_controller_1.getQuickActions);
router.post("/actions", admin_home_experience_controller_1.createQuickAction);
router.put("/actions/:id", admin_home_experience_controller_1.updateQuickAction);
router.delete("/actions/:id", admin_home_experience_controller_1.deleteQuickAction);
// Sections
router.get("/sections", admin_home_experience_controller_1.getSections);
router.post("/sections", admin_home_experience_controller_1.createSection);
router.put("/sections/:id", admin_home_experience_controller_1.updateSection);
router.delete("/sections/:id", admin_home_experience_controller_1.deleteSection);
// Analytics
router.get("/analytics", admin_home_experience_controller_1.getHomeAnalytics);
exports.default = router;
