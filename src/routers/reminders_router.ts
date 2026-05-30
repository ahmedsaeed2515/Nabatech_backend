import { Router } from "express";
import { getReminders, createReminder, updateReminder, deleteReminder } from "../controllers/reminders_controller";
import { protect } from "../middlewares/auth_middleware";

const router = Router();

router.get("/", protect, getReminders);
router.post("/", protect, createReminder);
router.put("/:id", protect, updateReminder);
router.delete("/:id", protect, deleteReminder);

export default router;
