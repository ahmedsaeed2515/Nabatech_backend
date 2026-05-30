import { Router } from "express";
import { getMyPlants, addPlant, updatePlant, deletePlant, waterPlant } from "../controllers/my_plants_controller";
import { protect } from "../middlewares/auth_middleware";

const router = Router();

router.get("/", protect, getMyPlants);
router.post("/", protect, addPlant);
router.put("/:id", protect, updatePlant);
router.delete("/:id", protect, deletePlant);
router.post("/:id/water", protect, waterPlant);

export default router;
