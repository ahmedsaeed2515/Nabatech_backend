import { Router } from "express";
import { getCommunityPosts, createPost, toggleLike, getComments, createComment } from "../controllers/community_controller";
import { protect } from "../middlewares/auth_middleware";
import upload from "../middlewares/upload_middleware";

const router = Router();

router.get("/posts", protect, getCommunityPosts);
router.post("/posts", protect, upload.single("file"), createPost);
router.post("/posts/:id/like", protect, toggleLike);
router.get("/posts/:id/comments", protect, getComments);
router.post("/posts/:id/comments", protect, createComment);

export default router;
