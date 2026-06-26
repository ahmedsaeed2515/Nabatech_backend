import { Router } from "express";
import { 
  getChatLogs, 
  getChatLogById, 
  getChatSessions, 
  getChatAnalytics, 
  getChatToolCalls, 
  getChatDiagnoses 
} from "../controllers/admin_chat_logs_controller";
import { protect, authorizeRoles } from '../middlewares/auth_middleware';

const router = Router();

// Protect all routes
router.use(protect, authorizeRoles("super_admin", "admin", "staff"));

router.get("/analytics", getChatAnalytics);
router.get("/sessions", getChatSessions);
router.get("/tool-calls", getChatToolCalls);
router.get("/diagnoses", getChatDiagnoses);
router.get("/:id", getChatLogById);
router.get("/", getChatLogs);

export default router;


