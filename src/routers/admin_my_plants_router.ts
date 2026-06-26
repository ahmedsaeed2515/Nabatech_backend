import { Router } from "express";
import { getAdminPlants, deleteAdminPlant } from "../controllers/admin_my_plants_controller";
import { protect, admin } from "../middlewares/auth_middleware";

const router = Router();

router.get("/", protect, admin, getAdminPlants);
router.delete("/:id", protect, admin, deleteAdminPlant);

export default router;


