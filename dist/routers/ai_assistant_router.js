"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const upload_middleware_1 = __importDefault(require("../middlewares/upload_middleware"));
const ai_assistant_controller_1 = require("../controllers/ai_assistant_controller");
const router = (0, express_1.Router)();
router.post("/assistant", auth_middleware_1.protect, upload_middleware_1.default.single("file"), ai_assistant_controller_1.postAssistantRequest);
router.post("/draft", auth_middleware_1.protect, ai_assistant_controller_1.postGenerateDraft);
exports.default = router;
