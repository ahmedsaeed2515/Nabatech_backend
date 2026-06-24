"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const upload_controller_1 = require("../controllers/upload_controller");
const upload_middleware_1 = __importDefault(require("../middlewares/upload_middleware"));
const auth_middleware_1 = require("../middlewares/auth_middleware");
const router = (0, express_1.Router)();
// Generic image upload – returns URL only (no DB update)
router.post("/image", auth_middleware_1.protect, upload_middleware_1.default.single('image'), upload_controller_1.uploadImage);
// Avatar upload – uploads to Cloudinary + saves avatarUrl to User
router.post("/avatar", auth_middleware_1.protect, upload_middleware_1.default.single('avatar'), upload_controller_1.uploadAvatar);
// Cover image upload – uploads to Cloudinary + saves coverUrl to User
router.post("/cover", auth_middleware_1.protect, upload_middleware_1.default.single('cover'), upload_controller_1.uploadCover);
exports.default = router;
