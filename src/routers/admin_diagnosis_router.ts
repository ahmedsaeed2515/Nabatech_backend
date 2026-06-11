import { Router } from "express";
import { getAdminDiagnoses, getAdminDiagnosisAnalytics } from "../controllers/admin_diagnosis_controller";
import { protect, admin } from "../middlewares/auth_middleware";
import { validateRequest } from "../middlewares/validate_request_middleware";
import { adminDiagnosisQuerySchema, adminDiagnosisAnalyticsQuerySchema } from "../validation/history_schemas";

const router = Router();

// Base route is /api/admin/diagnoses
router.get("/", protect, admin, validateRequest(adminDiagnosisQuerySchema), getAdminDiagnoses);
router.get("/analytics", protect, admin, validateRequest(adminDiagnosisAnalyticsQuerySchema), getAdminDiagnosisAnalytics);

export default router;
