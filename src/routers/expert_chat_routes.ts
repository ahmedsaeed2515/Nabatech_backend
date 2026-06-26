import { Router } from "express";
import { initExpertChat, getExpertMessages, sendExpertMessage } from "../controllers/expert_chat_controller";
import { protect } from "../middlewares/auth_middleware";

const router = Router();

router.use(protect); // Ensure all chat routes require authentication

router.post("/init", initExpertChat);
router.get("/:sessionId/messages", getExpertMessages);
router.post("/:sessionId/messages", sendExpertMessage);

export default router;


