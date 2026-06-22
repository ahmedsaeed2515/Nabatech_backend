"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const validate_request_middleware_1 = require("../middlewares/validate_request_middleware");
const specialist_offer_schemas_1 = require("../validation/specialist_offer_schemas");
const community_schemas_1 = require("../validation/community_schemas");
const specialist_offers_controller_1 = require("../controllers/specialist_offers_controller");
const community_follow_controller_1 = require("../controllers/community_follow_controller");
const reputation_controller_1 = require("../controllers/reputation_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const upload_middleware_1 = __importDefault(require("../middlewares/upload_middleware"));
const rate_limit_middleware_1 = require("../middlewares/rate_limit_middleware");
const community_notification_controller_1 = require("../controllers/community_notification_controller");
const poll_controller_1 = require("../controllers/poll_controller");
const consultation_controller_1 = require("../controllers/consultation_controller");
const community_controller_1 = require("../controllers/community_controller");
const router = (0, express_1.Router)();
// Activity Center
router.get("/activity", auth_middleware_1.protect, community_controller_1.getActivityCenter);
// Saved Posts
router.get("/saved", auth_middleware_1.protect, community_controller_1.getSavedPosts);
router.post("/posts/:id/save", auth_middleware_1.protect, community_controller_1.toggleSave);
router.get("/posts", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.feedQuerySchema), community_controller_1.getCommunityPosts);
router.get("/search", auth_middleware_1.protect, rate_limit_middleware_1.communitySearchLimiter, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.searchQuerySchema), community_controller_1.searchPosts);
router.get("/trending", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.trendingQuerySchema), community_controller_1.getTrendingPosts);
router.post("/posts", auth_middleware_1.protect, rate_limit_middleware_1.communityPostLimiter, upload_middleware_1.default.single("file"), (0, validate_request_middleware_1.validateRequest)(community_schemas_1.createPostSchema), community_controller_1.createPost);
router.post("/posts/:id/like", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.toggleLikeSchema), community_controller_1.toggleLike);
router.get("/posts/:id/comments", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.commentsQuerySchema), community_controller_1.getComments);
router.post("/posts/:id/comments", auth_middleware_1.protect, rate_limit_middleware_1.communityCommentLimiter, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.createCommentSchema), community_controller_1.createComment);
router.put("/posts/:id/comments/:commentId", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.updateCommentSchema), community_controller_1.updateComment);
router.delete("/posts/:id/comments/:commentId", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.deleteCommentSchema), community_controller_1.deleteComment);
router.put("/posts/:id", auth_middleware_1.protect, upload_middleware_1.default.single("file"), (0, validate_request_middleware_1.validateRequest)(community_schemas_1.updatePostSchema), community_controller_1.updatePost);
router.delete("/posts/:id", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(community_schemas_1.deletePostSchema), community_controller_1.deletePost);
router.post('/offers', auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)('expert'), (0, validate_request_middleware_1.validateRequest)(specialist_offer_schemas_1.createOfferSchema), specialist_offers_controller_1.createSpecialistOffer);
router.get("/offers/sent", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(specialist_offer_schemas_1.offersQuerySchema), specialist_offers_controller_1.getSentSpecialistOffers);
router.get("/offers/received", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(specialist_offer_schemas_1.offersQuerySchema), specialist_offers_controller_1.getReceivedSpecialistOffers);
router.patch('/offers/:id/status', auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(specialist_offer_schemas_1.updateOfferStatusSchema), specialist_offers_controller_1.updateSpecialistOfferStatus);
// Follow System
router.post('/follow/:userId', auth_middleware_1.protect, rate_limit_middleware_1.communityFollowLimiter, community_follow_controller_1.followUser);
router.delete('/follow/:userId', auth_middleware_1.protect, rate_limit_middleware_1.communityFollowLimiter, community_follow_controller_1.unfollowUser);
router.get('/followers/:userId', auth_middleware_1.protect, community_follow_controller_1.getFollowers);
router.get('/following/:userId', auth_middleware_1.protect, community_follow_controller_1.getFollowing);
// Reputation System
router.get('/reputation/leaderboard', auth_middleware_1.protect, reputation_controller_1.getLeaderboard);
router.get('/reputation/:userId', auth_middleware_1.protect, reputation_controller_1.getUserReputation);
// Notifications System
router.get('/notifications', auth_middleware_1.protect, community_notification_controller_1.CommunityNotificationController.getNotifications);
router.patch('/notifications/read-all', auth_middleware_1.protect, community_notification_controller_1.CommunityNotificationController.markAllAsRead);
router.patch('/notifications/:id/read', auth_middleware_1.protect, community_notification_controller_1.CommunityNotificationController.markAsRead);
// Polls
router.post('/polls/:pollId/vote', auth_middleware_1.protect, poll_controller_1.voteOnPoll);
// Consultations
router.post('/consultations', auth_middleware_1.protect, consultation_controller_1.bookConsultation);
exports.default = router;
