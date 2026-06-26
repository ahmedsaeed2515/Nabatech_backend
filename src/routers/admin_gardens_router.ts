import { Router } from "express";
import { getAdminGardens, getAdminGardenById } from "../controllers/admin_gardens_controller";
import { protect, authorizeRoles } from "../middlewares/auth_middleware";

const router = Router();
const adminOrMod = authorizeRoles('moderator', 'admin', 'super_admin');

router.get("/", protect, adminOrMod, getAdminGardens);
router.get("/:id", protect, adminOrMod, getAdminGardenById);

export default router;


