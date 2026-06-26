import { Router } from "express";
import { 
  getWidgets, createWidget, updateWidget, deleteWidget,
  getBanners, createBanner, updateBanner, deleteBanner,
  getQuickActions, createQuickAction, updateQuickAction, deleteQuickAction,
  getSections, createSection, updateSection, deleteSection,
  getHomeAnalytics
} from "../controllers/admin_home_experience_controller";
import { protect, authorizeRoles } from "../middlewares/auth_middleware";

const router = Router();

router.use(protect, authorizeRoles("super_admin", "admin", "staff"));

// Widgets
router.get("/widgets", getWidgets);
router.post("/widgets", createWidget);
router.put("/widgets/:id", updateWidget);
router.delete("/widgets/:id", deleteWidget);

// Banners
router.get("/banners", getBanners);
router.post("/banners", createBanner);
router.put("/banners/:id", updateBanner);
router.delete("/banners/:id", deleteBanner);

// Quick Actions
router.get("/actions", getQuickActions);
router.post("/actions", createQuickAction);
router.put("/actions/:id", updateQuickAction);
router.delete("/actions/:id", deleteQuickAction);

// Sections
router.get("/sections", getSections);
router.post("/sections", createSection);
router.put("/sections/:id", updateSection);
router.delete("/sections/:id", deleteSection);

// Analytics
router.get("/analytics", getHomeAnalytics);

export default router;


