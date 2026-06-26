import { Router } from "express";
import { protect, admin } from "../middlewares/auth_middleware";
import { bulkImport, adminSearchPlants } from "../controllers/plant_library_controller";

const router = Router();

// Wildcard text search for admin
router.get("/search", protect, admin, adminSearchPlants);

// Bulk import route (admin only)
router.post("/imports", protect, admin, bulkImport);

export default router;


