import { Router } from "express";
import { getMyPlants, getPlantById, addPlant, updatePlant, deletePlant, waterPlant, getWateringLogs, uploadPlantImage, getPlantDashboard } from "../controllers/my_plants_controller";
import { protect } from "../middlewares/auth_middleware";
import upload from "../middlewares/upload_middleware";

const router = Router();

router.get("/", protect, getMyPlants);
router.get("/:id", protect, getPlantById);
router.post("/", protect, addPlant);
router.put("/:id", protect, updatePlant);
router.delete("/:id", protect, deletePlant);
router.post("/:id/water", protect, waterPlant);
router.get("/:id/water-logs", protect, getWateringLogs);
router.post("/:id/image", protect, upload.single("file"), uploadPlantImage);
router.get("/:id/dashboard", protect, getPlantDashboard);

export default router;
