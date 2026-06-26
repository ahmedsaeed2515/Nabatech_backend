import express from "express";
import { protect, authorizeRoles } from "../middlewares/auth_middleware";
import {
  getDatabaseStats,
  getCollections,
  getCollectionDetails,
  getStorageAnalyzer,
  cleanupDatabase,
  dropCollection,
  purgeCollection,
} from "../controllers/admin_database_controller";

const router = express.Router();

// All routes here are protected and require admin or super_admin
router.use(protect, authorizeRoles("admin", "super_admin"));

// Phase 1 - DB Analytics
router.get("/stats", getDatabaseStats);

// Phase 2 - Collection Explorer
router.get("/collections", getCollections);

// Phase 4 - Storage Analyzer
router.get("/storage-analyzer", getStorageAnalyzer);

// Phase 5 - Cleanup Center
router.post("/cleanup", cleanupDatabase);

// Phase 3 - Collection Details (Parameter route usually placed later to avoid clashing)
router.get("/collections/:name", getCollectionDetails);

// Phase 6 - Super Admin Operations (Override role for specific destructive endpoints)
// We add authorizeRoles("super_admin") specifically here. Express will run both middlewares,
// so if user is 'admin', the first passes, but this second one will reject.
router.delete("/collections/:name/drop", authorizeRoles("super_admin"), dropCollection);
router.delete("/collections/:name/purge", authorizeRoles("super_admin"), purgeCollection);

export default router;


