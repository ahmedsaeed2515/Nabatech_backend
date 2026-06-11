import { Router } from 'express';
import { validateRequest } from '../middlewares/validate_request_middleware';
import { createOfferSchema, updateOfferStatusSchema, offersQuerySchema } from '../validation/specialist_offer_schemas';
import { feedQuerySchema, createPostSchema, toggleLikeSchema, commentsQuerySchema, createCommentSchema } from '../validation/community_schemas';
import { getCommunityPosts, createPost, toggleLike, getComments, createComment } from "../controllers/community_controller";
import {
  createSpecialistOffer,
  getReceivedSpecialistOffers,
  getSentSpecialistOffers,
  updateSpecialistOfferStatus,
} from "../controllers/specialist_offers_controller";
import { protect } from "../middlewares/auth_middleware";
import upload from "../middlewares/upload_middleware";

const router = Router();

router.get("/posts", protect, validateRequest(feedQuerySchema), getCommunityPosts);
router.post("/posts", protect, upload.single("file"), validateRequest(createPostSchema), createPost);
router.post("/posts/:id/like", protect, validateRequest(toggleLikeSchema), toggleLike);
router.get("/posts/:id/comments", protect, validateRequest(commentsQuerySchema), getComments);
router.post("/posts/:id/comments", protect, validateRequest(createCommentSchema), createComment);
router.post('/offers', protect, validateRequest(createOfferSchema), createSpecialistOffer);
router.get("/offers/sent", protect, validateRequest(offersQuerySchema), getSentSpecialistOffers);
router.get("/offers/received", protect, validateRequest(offersQuerySchema), getReceivedSpecialistOffers);
router.patch('/offers/:id/status', protect, validateRequest(updateOfferStatusSchema), updateSpecialistOfferStatus);

export default router;
