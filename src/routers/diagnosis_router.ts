import { Router } from "express";
import { syncOfflineDiagnosis, generateDiagnosisAdvice } from "../controllers/diagnosis_controller";
import { protect } from "../middlewares/auth_middleware";

const router = Router();

router.post("/sync-offline", protect, syncOfflineDiagnosis);
router.get("/:historyId/advice", protect, generateDiagnosisAdvice);

export default router;
