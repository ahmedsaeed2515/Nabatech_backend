import { Router } from "express";
import { admin, protect } from "../middlewares/auth_middleware";
import {
  getAdminAiLogs,
  getAdminAiSettings,
  putAdminAiSettings,
  testAdminAiSettings,
  patchAiMode,
  testAiMode,
} from "../controllers/ai_settings_controller";

const router = Router();

router.get("/", protect, admin, getAdminAiSettings);
router.put("/", protect, admin, putAdminAiSettings);
router.post("/test", protect, admin, testAdminAiSettings);
router.get("/logs", protect, admin, getAdminAiLogs);

// ── AI Mode Switching ──────────────────────────────────────────────────────────
router.patch("/mode", protect, admin, patchAiMode);       // تبديل الوضع فوراً
router.post("/test-mode", protect, admin, testAiMode);    // اختبار وضع بدون تبديل

export default router;
