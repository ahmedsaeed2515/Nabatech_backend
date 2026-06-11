import { Router } from "express";
import { protect } from "../middlewares/auth_middleware";
import { validateRequest } from "../middlewares/validate_request_middleware";
import {
  createLightMeterHistory,
  createWateringHistory,
  getLightMeterHistory,
  getLightRecommendation,
  getWateringHistory,
  getWateringRecommendation,
} from "../controllers/home_tools_controller";
import {
  lightMeterHistorySchema,
  wateringHistorySchema,
  paginationQuerySchema,
  lightRecommendationSchema,
  wateringRecommendationSchema,
} from "../validation/home_tools_schemas";

const router = Router();

router.get("/light-meter/history", protect, validateRequest(paginationQuerySchema), getLightMeterHistory);
router.post("/light-meter/history", protect, validateRequest(lightMeterHistorySchema), createLightMeterHistory);
router.get("/light-meter/recommendations/:plantId", protect, validateRequest(lightRecommendationSchema), getLightRecommendation);

router.get("/watering/history", protect, validateRequest(paginationQuerySchema), getWateringHistory);
router.post("/watering/history", protect, validateRequest(wateringHistorySchema), createWateringHistory);
router.get("/watering/recommendations", protect, validateRequest(wateringRecommendationSchema), getWateringRecommendation);

export default router;
