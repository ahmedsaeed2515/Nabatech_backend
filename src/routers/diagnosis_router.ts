import { Router } from "express";
import { syncOfflineDiagnosis, generateDiagnosisAdvice, predictOnline } from "../controllers/diagnosis_controller";
import { protect } from "../middlewares/auth_middleware";
import upload from "../middlewares/upload_middleware"; // Assuming it exists

const router = Router();

router.post("/sync-offline", protect, upload.single("image"), syncOfflineDiagnosis);
router.post("/predict", protect, upload.single("image"), predictOnline);
router.get("/:historyId/advice", protect, generateDiagnosisAdvice);

export default router;
