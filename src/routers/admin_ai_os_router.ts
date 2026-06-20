import { Router } from "express";
import { 
  getAgentProfiles,
  updateAgentProfile,
  getPolicies,
  updatePolicy,
  getPrompts,
  updatePrompt,
  getAuditLogs
} from "../controllers/admin_ai_os_controller";
import { protect, authorizeRoles } from "../middlewares/auth_middleware";

const router = Router();

// Ensure only super admin or AI engineers have access to the AI OS Center
router.use(protect, authorizeRoles("super_admin", "admin", "staff"));

// Agents
router.get("/agents", getAgentProfiles);
router.put("/agents/:id", updateAgentProfile);
router.post("/agents", updateAgentProfile); // Overloading update to handle create

// Policies
router.get("/policies", getPolicies);
router.put("/policies/:type/:id", updatePolicy);
router.post("/policies/:type", updatePolicy); // Overloading update to handle create

// Prompts
router.get("/prompts", getPrompts);
router.put("/prompts/:id", updatePrompt);
router.post("/prompts", updatePrompt);

// Audit
router.get("/audit-logs", getAuditLogs);

export default router;
