import { Router } from "express";
import { protect, admin } from "../middlewares/auth_middleware";
import { bulkImport } from "../controllers/plant_library_controller";

const router = Router();

// Bulk import route (admin only)
// Bulk import route (admin only)
router.post("/imports", protect, admin, bulkImport);

export default router;
