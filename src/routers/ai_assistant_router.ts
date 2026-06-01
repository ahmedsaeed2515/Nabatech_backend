import { Router } from "express";
import { protect } from "../middlewares/auth_middleware";
import upload from "../middlewares/upload_middleware";
import { postAssistantRequest } from "../controllers/ai_assistant_controller";

const router = Router();

router.post("/assistant", protect, upload.single("file"), postAssistantRequest);

export default router;

