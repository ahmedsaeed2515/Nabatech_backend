import express from "express";
import { protect, authorize } from "../middlewares/auth_middleware";
import {
  getProviders,
  createProvider,
  updateProvider,
  checkHealth,
  testProvider,
  getAnalytics
} from "../controllers/admin_ai_providers_controller";

const router = express.Router();

router.use(protect);
router.use(authorize("admin", "superadmin"));

router.get("/", getProviders);
router.post("/", createProvider);
router.get("/health", checkHealth);
router.get("/analytics", getAnalytics);
router.put("/:id", updateProvider);
router.post("/:id/test", testProvider);

export default router;
