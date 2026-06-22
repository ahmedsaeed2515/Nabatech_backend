import { Router } from "express";
import { protect } from "../middlewares/auth_middleware";
import upload from "../middlewares/upload_middleware";
import { postAssistantRequest, postGenerateDraft, postQueryLibrary, postTestAssistantRequest, getGreeting } from "../controllers/ai_assistant_controller";
import { VoiceController } from "../controllers/voice_controller";
import { aiRateLimiter } from "../middlewares/rate_limit_middleware";

const router = Router();

router.post("/assistant", aiRateLimiter, protect, upload.single("file"), postAssistantRequest);
router.post("/test_assistant", upload.single("file"), postTestAssistantRequest);
router.post("/draft", aiRateLimiter, protect, postGenerateDraft);
router.post("/query-library", aiRateLimiter, protect, postQueryLibrary);
router.get("/greeting", aiRateLimiter, protect, getGreeting);
router.post("/voice/command", aiRateLimiter, protect, VoiceController.processVoiceCommand);

export default router;

