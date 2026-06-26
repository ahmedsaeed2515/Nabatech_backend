import { Router } from "express";
import { 
  getStoreProducts, 
  getExperts, 
  getOutbreaks,
  createStoreProduct,
  deleteStoreProduct,
  createExpert,
  deleteExpert,
  createOutbreak,
  deleteOutbreak,
  updateOutbreak
} from "../controllers/explore_controller";
import { getArScanSessions, createArScanSession } from "../controllers/ar_scan_controller";
import {
  getExploreFeed,
  getFeaturedContent,
  getTrendingContent,
  getRecommendations,
  recordExploreEvent,
  createExplorePlacement,
  updateExplorePlacement,
  deleteExplorePlacement,
  getAdminExploreStats,
  getAdminExplorePlacements,
  getAdminExploreSections,
  createExploreSection,
  updateExploreSection,
  deleteExploreSection
} from "../controllers/explore_engine_controller";
import { protect, admin, authorizeRoles } from "../middlewares/auth_middleware";
import jwt from "jsonwebtoken";
import User from "../models/user_model";
import { Request, Response, NextFunction } from "express";

const router = Router();
const adminOrMod = authorizeRoles('moderator', 'admin', 'super_admin');

const optionalProtect = async (req: Request, res: Response, next: NextFunction) => {
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      const jwtSecret = process.env.JWT_SECRET;
      if (jwtSecret) {
        const decoded = jwt.verify(token, jwtSecret) as any;
        const user = await User.findById(decoded.id).select('-password');
        if (user && user.status !== 'disabled' && user.tokenVersion === decoded.tokenVersion) {
          (req as any).user = user;
        }
      }
    } catch (error) {
      // Fail silently and proceed as guest
    }
  }
  next();
};

// --- Unified Discovery Feed & AI Recommendations ---
router.get("/", optionalProtect, getExploreFeed);
router.get("/featured", getFeaturedContent);
router.get("/trending", getTrendingContent);
router.post("/event", optionalProtect, recordExploreEvent);
router.get("/recommendations", protect, getRecommendations);
router.get("/ar-scan-sessions", protect, getArScanSessions);
router.get("/ar-scan-sessions/:plantId", protect, getArScanSessions);
router.post("/ar-scan-sessions", protect, createArScanSession);

// --- Admin explore placement config & stats ---
router.get("/admin/stats", protect, adminOrMod, getAdminExploreStats);
router.get("/admin/content", protect, adminOrMod, getAdminExplorePlacements);
router.post("/admin/content", protect, admin, createExplorePlacement);
router.put("/admin/content/:id", protect, admin, updateExplorePlacement);
router.delete("/admin/content/:id", protect, admin, deleteExplorePlacement);

// --- Admin explore sections config ---
router.get("/admin/sections", protect, adminOrMod, getAdminExploreSections);
router.post("/admin/sections", protect, admin, createExploreSection);
router.put("/admin/sections/:id", protect, admin, updateExploreSection);
router.delete("/admin/sections/:id", protect, admin, deleteExploreSection);

// --- Legacy Explore Catalogs (backward compatible) ---
router.get("/store-products", getStoreProducts);
router.post("/store-products", protect, admin, createStoreProduct);
router.delete("/store-products/:id", protect, admin, deleteStoreProduct);

router.get("/experts", protect, getExperts);
router.post("/experts", protect, admin, createExpert);
router.delete("/experts/:id", protect, admin, deleteExpert);

router.get("/outbreaks", getOutbreaks);
router.post("/outbreaks", protect, admin, createOutbreak);
router.put("/outbreaks/:id", protect, admin, updateOutbreak);
router.delete("/outbreaks/:id", protect, admin, deleteOutbreak);

export default router;


