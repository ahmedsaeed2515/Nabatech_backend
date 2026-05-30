import { Router } from "express";
import { getHistory, deleteDiagnosis, clearHistory, updateFeedback } from "../controllers/history_controller";
import { protect } from "../middlewares/auth_middleware";

const router = Router();

router.get("/", protect, getHistory);
router.delete("/:id", protect, deleteDiagnosis);
router.delete("/", protect, clearHistory);
router.put("/:id/feedback", protect, updateFeedback);

export default router;
