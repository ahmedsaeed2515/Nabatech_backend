import { Router } from "express";
import { protect, admin } from "../middlewares/auth_middleware";
import { chatWithAI, getChatHistory, getChatSessions, getAllChatLogs, submitFeedback } from "../controllers/chat_controller";
import { aiRateLimiter } from "../middlewares/rate_limit_middleware";

const router = Router();

router.post("/", aiRateLimiter, protect, chatWithAI);
router.post("/feedback", protect, submitFeedback);
router.get("/history", protect, getChatHistory);
router.get("/sessions", protect, getChatSessions);
router.get("/all", protect, admin, getAllChatLogs);

export default router;
