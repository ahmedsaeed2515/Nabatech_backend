import { Router } from "express";
import { getHistory, getDiagnosisById, deleteDiagnosis, clearHistory, updateFeedback } from "../controllers/history_controller";
import { protect } from "../middlewares/auth_middleware";
import { validateRequest } from "../middlewares/validate_request_middleware";
import { historyQuerySchema, updateFeedbackSchema, clearHistoryQuerySchema } from "../validation/history_schemas";

const router = Router();

router.get("/", protect, validateRequest(historyQuerySchema), getHistory);
router.get("/:id", protect, getDiagnosisById);
router.delete("/:id", protect, deleteDiagnosis);
router.delete("/", protect, validateRequest(clearHistoryQuerySchema), clearHistory);
router.put("/:id/feedback", protect, validateRequest(updateFeedbackSchema), updateFeedback);

export default router;


