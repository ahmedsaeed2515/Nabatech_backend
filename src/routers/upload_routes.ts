import { Router } from "express";
import { uploadImage, uploadAvatar, uploadCover } from "../controllers/upload_controller";
import upload from "../middlewares/upload_middleware";
import { protect } from "../middlewares/auth_middleware";

const router = Router();

// Generic image upload – returns URL only (no DB update)
router.post("/image", protect, upload.single('image'), uploadImage);

// Avatar upload – uploads to Cloudinary + saves avatarUrl to User
router.post("/avatar", protect, upload.single('avatar'), uploadAvatar);

// Cover image upload – uploads to Cloudinary + saves coverUrl to User
router.post("/cover", protect, upload.single('cover'), uploadCover);

export default router;



