"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var upload_middleware_1 = __importDefault(require("../middlewares/upload_middleware"));
var ai_assistant_controller_1 = require("../controllers/ai_assistant_controller");
var voice_controller_1 = require("../controllers/voice_controller");
var rate_limit_middleware_1 = require("../middlewares/rate_limit_middleware");
var router = (0, express_1.Router)();
router.post("/assistant", rate_limit_middleware_1.aiRateLimiter, auth_middleware_1.protect, upload_middleware_1.default.single("file"), ai_assistant_controller_1.postAssistantRequest);
router.post("/draft", rate_limit_middleware_1.aiRateLimiter, auth_middleware_1.protect, ai_assistant_controller_1.postGenerateDraft);
router.post("/query-library", rate_limit_middleware_1.aiRateLimiter, auth_middleware_1.protect, ai_assistant_controller_1.postQueryLibrary);
router.post("/voice/command", rate_limit_middleware_1.aiRateLimiter, auth_middleware_1.protect, voice_controller_1.VoiceController.processVoiceCommand);
exports.default = router;
