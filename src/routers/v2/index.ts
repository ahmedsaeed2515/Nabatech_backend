import { Router } from 'express';
import { AuthController } from '../../controllers/AuthController';
import { GardenController } from '../../controllers/GardenController';
import { ZoneController } from '../../controllers/ZoneController';
import { PlantController } from '../../controllers/PlantController';
import { CareController } from '../../controllers/CareController';
import { TaskController } from '../../controllers/TaskController';
import { GrowthController } from '../../controllers/GrowthController';
import { ChatController } from '../../controllers/ChatController';
import { AnalyticsController } from '../../controllers/AnalyticsController';
import { CommunityController } from '../../controllers/CommunityController';
import { ToolingController } from '../../controllers/ToolingController';
import { EdgeController } from '../../controllers/EdgeController';
import upload from '../../middlewares/upload_middleware';
import { protectV2 } from '../../middlewares/auth_v2';
import { IdempotencyCheck } from '../../middlewares/idempotency';
import { validateRequest } from '../../middlewares/validate_request_middleware';
import {
  createWishlistItemSchema,
  updateWishlistItemSchema,
  createInventoryItemSchema,
  updateInventoryItemSchema
} from '../../validation/v2';

const router = Router();

const authController = new AuthController();
const gardenController = new GardenController();
const zoneController = new ZoneController();
const plantController = new PlantController();
const careController = new CareController();
const taskController = new TaskController();
const growthController = new GrowthController();
const chatController = new ChatController();
const analyticsController = new AnalyticsController();
const communityController = new CommunityController();
const toolingController = new ToolingController();
const edgeController = new EdgeController();

// Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);

// Gardens
router.post('/gardens', protectV2, IdempotencyCheck, gardenController.createGarden);
router.get('/gardens', protectV2, gardenController.getGardens);

// Zones
router.post('/zones', protectV2, IdempotencyCheck, zoneController.createZone);
router.get('/zones', protectV2, zoneController.getZones);

// Plants
router.post('/plants', protectV2, IdempotencyCheck, plantController.createPlant);
router.get('/plants/:id', protectV2, plantController.getPlantDetails); // Maps to GET /plants/:id
router.get('/plants/:id/details', protectV2, plantController.getPlantDetails);
router.put('/plants/:id', protectV2, IdempotencyCheck, plantController.updatePlant);

// Care Actions & Fertilizer
router.post('/plants/:id/care', protectV2, IdempotencyCheck, careController.logCareAction);
router.post('/plants/:id/fertilizer', protectV2, IdempotencyCheck, careController.logFertilizer);

// Tasks
router.get('/tasks/daily', protectV2, taskController.getDailyTasks);
router.put('/tasks/:id/complete', protectV2, IdempotencyCheck, taskController.completeTask);

// Growth Tracking
router.post('/plants/:id/growth', protectV2, IdempotencyCheck, upload.single('image'), growthController.logMeasurement);
router.get('/plants/:id/growth/timeline', protectV2, growthController.getTimeline);

// AI Chat
router.post('/chat', protectV2, chatController.processChat);

// Analytics & Reports
router.post('/analytics/snapshot', protectV2, IdempotencyCheck, analyticsController.generateSnapshot);
router.get('/analytics/snapshot', protectV2, analyticsController.getSnapshots);
router.post('/analytics/ai-report', protectV2, IdempotencyCheck, analyticsController.triggerAiReport);
router.get('/analytics/ai-report', protectV2, analyticsController.getAiReports);

// Community
router.post('/posts', protectV2, IdempotencyCheck, upload.single('image'), communityController.createPost);
router.get('/posts', protectV2, communityController.getPosts);
router.delete('/posts/:id', protectV2, communityController.deletePost);
router.post('/posts/:id/like', protectV2, IdempotencyCheck, communityController.toggleLike);
router.post('/posts/:id/comments', protectV2, IdempotencyCheck, communityController.addComment);
router.get('/posts/:id/comments', protectV2, communityController.getComments);

// Tooling (Wishlist & Inventory)
router.post('/wishlist', protectV2, validateRequest(createWishlistItemSchema), IdempotencyCheck, toolingController.createWishlistItem);
router.get('/wishlist', protectV2, toolingController.getWishlist);
router.put('/wishlist/:id', protectV2, validateRequest(updateWishlistItemSchema), IdempotencyCheck, toolingController.updateWishlistItem);
router.delete('/wishlist/:id', protectV2, toolingController.deleteWishlistItem);

router.post('/inventory', protectV2, validateRequest(createInventoryItemSchema), IdempotencyCheck, toolingController.createInventoryItem);
router.get('/inventory', protectV2, toolingController.getInventory);
router.put('/inventory/:id', protectV2, validateRequest(updateInventoryItemSchema), IdempotencyCheck, toolingController.updateInventoryItem);
router.delete('/inventory/:id', protectV2, toolingController.deleteInventoryItem);

// Edge Features (Voice & Timelapse)
router.post('/edge/voice', protectV2, upload.single('audio'), edgeController.processVoiceCommand);
router.post('/edge/timelapse', protectV2, IdempotencyCheck, edgeController.requestTimelapse);
router.get('/edge/timelapse', protectV2, edgeController.getTimelapseJobs);

export default router;
