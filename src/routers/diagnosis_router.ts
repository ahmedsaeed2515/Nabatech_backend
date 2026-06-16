import { Router } from "express";
import { predictPlantDisease, syncOfflineDiagnosis, generateDiagnosisAdvice } from "../controllers/diagnosis_controller";
import { protect } from "../middlewares/auth_middleware";
import upload from "../middlewares/upload_middleware";

const router = Router();

router.post("/predict", protect, upload.single("file"), predictPlantDisease);
router.post("/sync-offline", protect, syncOfflineDiagnosis);
router.get("/:historyId/advice", protect, generateDiagnosisAdvice);

export default router;
