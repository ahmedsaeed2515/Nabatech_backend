import express from "express";
import { protect, authorizeRoles } from "../middlewares/auth_middleware";
import {
  getCloudinaryStats,
  getAssets,
  getFolderAnalytics,
  detectOrphans,
  deleteAsset,
  bulkDeleteAssets,
  cleanupOrphans
} from "../controllers/admin_cloudinary_controller";

const router = express.Router();

// Base protection
router.use(protect, authorizeRoles("admin", "super_admin"));

// Phase 1 - Analytics
router.get("/stats", getCloudinaryStats);

// Phase 2 - Media Explorer
router.get("/assets", getAssets);

// Phase 3 - Folder Analytics
router.get("/folders", getFolderAnalytics);

// Phase 4 - Orphan Detector
router.get("/orphans", detectOrphans);

// Phase 8 - Super Admin Security (Destructive Operations)
router.post("/assets/delete", authorizeRoles("super_admin"), deleteAsset);
router.post("/assets/bulk-delete", authorizeRoles("super_admin"), bulkDeleteAssets);
router.post("/orphans/cleanup", authorizeRoles("super_admin"), cleanupOrphans);

export default router;
