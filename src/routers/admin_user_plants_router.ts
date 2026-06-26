import { Router } from "express";
import { getAdminUserPlants, getAdminUserPlantById, updateAdminUserPlant, deleteAdminUserPlant, getAdminUserPlantsStats } from "../controllers/admin_user_plants_controller";
import { protect, authorizeRoles, admin } from "../middlewares/auth_middleware";

const router = Router();
const adminOrMod = authorizeRoles('moderator', 'admin', 'super_admin');

router.get("/stats", protect, adminOrMod, getAdminUserPlantsStats);
router.get("/", protect, adminOrMod, getAdminUserPlants);
router.get("/:id", protect, adminOrMod, getAdminUserPlantById);
router.put("/:id", protect, admin, updateAdminUserPlant);
router.delete("/:id", protect, admin, deleteAdminUserPlant);

export default router;


