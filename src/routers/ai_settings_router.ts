import { Router } from "express";
import { admin, protect } from "../middlewares/auth_middleware";
import {
  getAdminAiLogs,
  getAdminAiSettings,
  putAdminAiSettings,
  testAdminAiSettings,
} from "../controllers/ai_settings_controller";

const router = Router();

router.get("/", protect, admin, getAdminAiSettings);
router.put("/", protect, admin, putAdminAiSettings);
router.post("/test", protect, admin, testAdminAiSettings);
router.get("/logs", protect, admin, getAdminAiLogs);

export default router;
