import { Router } from "express";
import { protect, admin } from "../middlewares/auth_middleware";
import {
  getPlants,
  addPlant,
  updatePlant,
  deletePlant,
  getPlantById,
  archivePlant,
  publishPlant,
  searchPlants,
  getPlantStats,
  getCategoryStats,
  exportPlants,
  getDiseases,
  addDisease,
  updateDisease,
  deleteDisease,
} from "../controllers/plant_library_controller";

const router = Router();

// Plants Routes
router.get("/plants/search", searchPlants);
router.get("/plants/stats", protect, admin, getPlantStats);
router.get("/plants/categories/stats", getCategoryStats);
router.get("/plants/export", protect, admin, exportPlants);
router.get("/plants", getPlants);
router.get("/plants/:id", getPlantById);
router.post("/plants", protect, admin, addPlant);
router.put("/plants/:id", protect, admin, updatePlant);
router.delete("/plants/:id", protect, admin, deletePlant);
router.patch("/plants/:id/archive", protect, admin, archivePlant);
router.patch("/plants/:id/publish", protect, admin, publishPlant);

// Diseases Routes
router.get("/diseases", getDiseases);
router.post("/diseases", protect, admin, addDisease);
router.put("/diseases/:id", protect, admin, updateDisease);
router.delete("/diseases/:id", protect, admin, deleteDisease);

export default router;


