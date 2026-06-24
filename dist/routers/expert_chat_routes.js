"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expert_chat_controller_1 = require("../controllers/expert_chat_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const router = (0, express_1.Router)();
router.use(auth_middleware_1.protect); // Ensure all chat routes require authentication
router.post("/init", expert_chat_controller_1.initExpertChat);
router.get("/:sessionId/messages", expert_chat_controller_1.getExpertMessages);
router.post("/:sessionId/messages", expert_chat_controller_1.sendExpertMessage);
exports.default = router;
