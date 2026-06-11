import { Router } from "express";
import { getAdminReminders, getAdminStats } from "../controllers/reminders_controller";
import { protect, admin } from "../middlewares/auth_middleware";

const router = Router();

router.get("/", protect, admin, getAdminReminders);
router.get("/stats", protect, admin, getAdminStats);

export default router;
