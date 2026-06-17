"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("../../controllers/AuthController");
const GardenController_1 = require("../../controllers/GardenController");
const ZoneController_1 = require("../../controllers/ZoneController");
const PlantController_1 = require("../../controllers/PlantController");
const CareController_1 = require("../../controllers/CareController");
const TaskController_1 = require("../../controllers/TaskController");
const GrowthController_1 = require("../../controllers/GrowthController");
const ChatController_1 = require("../../controllers/ChatController");
const AnalyticsController_1 = require("../../controllers/AnalyticsController");
const CommunityController_1 = require("../../controllers/CommunityController");
const ToolingController_1 = require("../../controllers/ToolingController");
const EdgeController_1 = require("../../controllers/EdgeController");
const upload_middleware_1 = __importDefault(require("../../middlewares/upload_middleware"));
const auth_v2_1 = require("../../middlewares/auth_v2");
const idempotency_1 = require("../../middlewares/idempotency");
const validate_request_middleware_1 = require("../../middlewares/validate_request_middleware");
const v2_1 = require("../../validation/v2");
const router = (0, express_1.Router)();
const authController = new AuthController_1.AuthController();
const gardenController = new GardenController_1.GardenController();
const zoneController = new ZoneController_1.ZoneController();
const plantController = new PlantController_1.PlantController();
const careController = new CareController_1.CareController();
const taskController = new TaskController_1.TaskController();
const growthController = new GrowthController_1.GrowthController();
const chatController = new ChatController_1.ChatController();
const analyticsController = new AnalyticsController_1.AnalyticsController();
const communityController = new CommunityController_1.CommunityController();
const toolingController = new ToolingController_1.ToolingController();
const edgeController = new EdgeController_1.EdgeController();
// Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
// Gardens
router.post('/gardens', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, gardenController.createGarden);
router.get('/gardens', auth_v2_1.protectV2, gardenController.getGardens);
// Zones
router.post('/zones', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, zoneController.createZone);
router.get('/zones', auth_v2_1.protectV2, zoneController.getZones);
// Plants
router.post('/plants', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, plantController.createPlant);
router.get('/plants/:id', auth_v2_1.protectV2, plantController.getPlantDetails); // Maps to GET /plants/:id
router.get('/plants/:id/details', auth_v2_1.protectV2, plantController.getPlantDetails);
router.put('/plants/:id', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, plantController.updatePlant);
// Care Actions & Fertilizer
router.post('/plants/:id/care', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, careController.logCareAction);
router.post('/plants/:id/fertilizer', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, careController.logFertilizer);
// Tasks
router.get('/tasks/daily', auth_v2_1.protectV2, taskController.getDailyTasks);
router.put('/tasks/:id/complete', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, taskController.completeTask);
// Growth Tracking
router.post('/plants/:id/growth', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, upload_middleware_1.default.single('image'), growthController.logMeasurement);
router.get('/plants/:id/growth/timeline', auth_v2_1.protectV2, growthController.getTimeline);
// AI Chat
router.post('/chat', auth_v2_1.protectV2, chatController.processChat);
// Analytics & Reports
router.post('/analytics/snapshot', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, analyticsController.generateSnapshot);
router.get('/analytics/snapshot', auth_v2_1.protectV2, analyticsController.getSnapshots);
router.post('/analytics/ai-report', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, analyticsController.triggerAiReport);
router.get('/analytics/ai-report', auth_v2_1.protectV2, analyticsController.getAiReports);
// Community
router.post('/posts', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, upload_middleware_1.default.single('image'), communityController.createPost);
router.get('/posts', auth_v2_1.protectV2, communityController.getPosts);
router.delete('/posts/:id', auth_v2_1.protectV2, communityController.deletePost);
router.post('/posts/:id/like', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, communityController.toggleLike);
router.post('/posts/:id/comments', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, communityController.addComment);
router.get('/posts/:id/comments', auth_v2_1.protectV2, communityController.getComments);
// Tooling (Wishlist & Inventory)
router.post('/wishlist', auth_v2_1.protectV2, (0, validate_request_middleware_1.validateRequest)(v2_1.createWishlistItemSchema), idempotency_1.IdempotencyCheck, toolingController.createWishlistItem);
router.get('/wishlist', auth_v2_1.protectV2, toolingController.getWishlist);
router.put('/wishlist/:id', auth_v2_1.protectV2, (0, validate_request_middleware_1.validateRequest)(v2_1.updateWishlistItemSchema), idempotency_1.IdempotencyCheck, toolingController.updateWishlistItem);
router.delete('/wishlist/:id', auth_v2_1.protectV2, toolingController.deleteWishlistItem);
router.post('/inventory', auth_v2_1.protectV2, (0, validate_request_middleware_1.validateRequest)(v2_1.createInventoryItemSchema), idempotency_1.IdempotencyCheck, toolingController.createInventoryItem);
router.get('/inventory', auth_v2_1.protectV2, toolingController.getInventory);
router.put('/inventory/:id', auth_v2_1.protectV2, (0, validate_request_middleware_1.validateRequest)(v2_1.updateInventoryItemSchema), idempotency_1.IdempotencyCheck, toolingController.updateInventoryItem);
router.delete('/inventory/:id', auth_v2_1.protectV2, toolingController.deleteInventoryItem);
// Edge Features (Voice & Timelapse)
router.post('/edge/voice', auth_v2_1.protectV2, upload_middleware_1.default.single('audio'), edgeController.processVoiceCommand);
router.post('/edge/timelapse', auth_v2_1.protectV2, idempotency_1.IdempotencyCheck, edgeController.requestTimelapse);
router.get('/edge/timelapse', auth_v2_1.protectV2, edgeController.getTimelapseJobs);
exports.default = router;
