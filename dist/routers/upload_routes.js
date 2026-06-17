"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("../controllers/upload_controller");
const upload_middleware_1 = __importDefault(require("../middlewares/upload_middleware"));
const auth_middleware_1 = require("../middlewares/auth_middleware");
const upload_controller_2 = require("../controllers/upload_controller");
const router = (0, express_1.Router)();
router.post("/image", auth_middleware_1.protect, upload_middleware_1.default.single('image'), upload_controller_1.uploadImage);
router.post("/avatar", auth_middleware_1.protect, upload_middleware_1.default.single('avatar'), upload_controller_2.uploadAvatar);
exports.default = router;
