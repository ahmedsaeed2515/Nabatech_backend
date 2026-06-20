"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var upload_controller_1 = require("../controllers/upload_controller");
var upload_middleware_1 = __importDefault(require("../middlewares/upload_middleware"));
var auth_middleware_1 = require("../middlewares/auth_middleware");
var upload_controller_2 = require("../controllers/upload_controller");
var router = (0, express_1.Router)();
router.post("/image", auth_middleware_1.protect, upload_middleware_1.default.single('image'), upload_controller_1.uploadImage);
router.post("/avatar", auth_middleware_1.protect, upload_middleware_1.default.single('avatar'), upload_controller_2.uploadAvatar);
exports.default = router;
