import { Router } from "express";
import { protect, admin } from "../middlewares/auth_middleware";
import {
  getPlants,
  addPlant,
  updatePlant,
  deletePlant,
  getDiseases,
  addDisease,
  updateDisease,
  deleteDisease,
} from "../controllers/plant_library_controller";

const router = Router();

// Plants Routes
router.get("/plants", getPlants);
router.post("/plants", protect, admin, addPlant);
router.put("/plants/:id", protect, admin, updatePlant);
router.delete("/plants/:id", protect, admin, deletePlant);

// Diseases Routes
router.get("/diseases", getDiseases);
router.post("/diseases", protect, admin, addDisease);
router.put("/diseases/:id", protect, admin, updateDisease);
router.delete("/diseases/:id", protect, admin, deleteDisease);

export default router;
