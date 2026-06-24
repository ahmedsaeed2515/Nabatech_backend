import { Router } from 'express';
import { validateRequest } from '../middlewares/validate_request_middleware';
import { createOfferSchema, updateOfferStatusSchema, offersQuerySchema } from '../validation/specialist_offer_schemas';
import { feedQuerySchema, createPostSchema, toggleLikeSchema, commentsQuerySchema, createCommentSchema, deletePostSchema, updatePostSchema, updateCommentSchema, deleteCommentSchema, searchQuerySchema, trendingQuerySchema } from '../validation/community_schemas';
import {
  createSpecialistOffer,
  getReceivedSpecialistOffers,
  getSentSpecialistOffers,
  updateSpecialistOfferStatus,
} from "../controllers/specialist_offers_controller";
import { followUser, unfollowUser, getFollowers, getFollowing } from "../controllers/community_follow_controller";
import { getUserReputation, getLeaderboard } from "../controllers/reputation_controller";
import { protect, authorizeRoles } from "../middlewares/auth_middleware";
import upload from "../middlewares/upload_middleware";
import { communityPostLimiter, communityCommentLimiter, communitySearchLimiter, communityFollowLimiter } from "../middlewares/rate_limit_middleware";
import { CommunityNotificationController } from "../controllers/community_notification_controller";
import { voteOnPoll } from "../controllers/poll_controller";
import { bookConsultation, getMyConsultations } from "../controllers/consultation_controller";

import { getCommunityPosts, createPost, toggleLike, getComments, createComment, deletePost, updatePost, updateComment, deleteComment, searchPosts, getTrendingPosts, toggleSave, getSavedPosts, getActivityCenter } from "../controllers/community_controller";
import { ReportController } from "../controllers/report_controller";

const router = Router();

// Reports
router.post('/reports', protect, ReportController.createReport);

// Activity Center
router.get("/activity", protect, getActivityCenter);

// Saved Posts
router.get("/saved", protect, getSavedPosts);
router.post("/posts/:id/save", protect, toggleSave);




router.get("/posts", protect, validateRequest(feedQuerySchema), getCommunityPosts);
router.get("/search", protect, communitySearchLimiter, validateRequest(searchQuerySchema), searchPosts);
router.get("/trending", protect, validateRequest(trendingQuerySchema), getTrendingPosts);
router.post("/posts", protect, communityPostLimiter, upload.array("files", 10), validateRequest(createPostSchema), createPost);
router.post("/posts/:id/like", protect, validateRequest(toggleLikeSchema), toggleLike);
router.get("/posts/:id/comments", protect, validateRequest(commentsQuerySchema), getComments);
router.post("/posts/:id/comments", protect, communityCommentLimiter, validateRequest(createCommentSchema), createComment);
router.put("/posts/:id/comments/:commentId", protect, validateRequest(updateCommentSchema), updateComment);
router.delete("/posts/:id/comments/:commentId", protect, validateRequest(deleteCommentSchema), deleteComment);
router.put("/posts/:id", protect, upload.array("files", 10), validateRequest(updatePostSchema), updatePost);
router.delete("/posts/:id", protect, validateRequest(deletePostSchema), deletePost);
router.post('/offers', protect, authorizeRoles('expert'), validateRequest(createOfferSchema), createSpecialistOffer);
router.get("/offers/sent", protect, validateRequest(offersQuerySchema), getSentSpecialistOffers);
router.get("/offers/received", protect, validateRequest(offersQuerySchema), getReceivedSpecialistOffers);
router.patch('/offers/:id/status', protect, validateRequest(updateOfferStatusSchema), updateSpecialistOfferStatus);

// Follow System
router.post('/follow/:userId', protect, communityFollowLimiter, followUser);
router.delete('/follow/:userId', protect, communityFollowLimiter, unfollowUser);
router.get('/followers/:userId', protect, getFollowers);
router.get('/following/:userId', protect, getFollowing);
// Reputation System
router.get('/reputation/leaderboard', protect, getLeaderboard);
router.get('/reputation/:userId', protect, getUserReputation);

// Notifications System
router.get('/notifications', protect, CommunityNotificationController.getNotifications);
router.patch('/notifications/read-all', protect, CommunityNotificationController.markAllAsRead);
router.patch('/notifications/:id/read', protect, CommunityNotificationController.markAsRead);

// Polls
router.post('/polls/:pollId/vote', protect, voteOnPoll);

// Consultations
router.post('/consultations', protect, bookConsultation);
router.get('/consultations/me', protect, getMyConsultations);

export default router;
