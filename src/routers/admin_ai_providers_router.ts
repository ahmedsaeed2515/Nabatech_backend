import express from "express";
import { protect, authorizeRoles } from "../middlewares/auth_middleware";
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
router.use(authorizeRoles("admin", "superadmin", "super_admin"));

router.get("/", getProviders);
router.post("/", createProvider);
router.get("/health", checkHealth);
router.get("/analytics", getAnalytics);
router.put("/:id", updateProvider);
router.post("/:id/test", testProvider);

export default router;


