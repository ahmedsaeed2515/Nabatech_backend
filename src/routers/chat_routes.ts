import { Router } from "express";
import { protect, admin } from "../middlewares/auth_middleware";
import { chatWithAI, getChatHistory, getChatSessions, getAllChatLogs } from "../controllers/chat_controller";

const router = Router();

router.post("/", protect, chatWithAI);
router.get("/history", protect, getChatHistory);
router.get("/sessions", protect, getChatSessions);
router.get("/all", protect, admin, getAllChatLogs);

export default router;
