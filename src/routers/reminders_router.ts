import { Router } from "express";
import { getReminders, createReminder, updateReminder, deleteReminder, getAdminReminders, getAdminStats } from "../controllers/reminders_controller";
import { protect, admin } from "../middlewares/auth_middleware";

const router = Router();

router.get("/", protect, getReminders);
router.post("/", protect, createReminder);
router.put("/:id", protect, updateReminder);
router.delete("/:id", protect, deleteReminder);

export default router;


