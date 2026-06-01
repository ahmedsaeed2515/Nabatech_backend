import { Router } from "express";
import { protect } from "../middlewares/auth_middleware";
import {
  createLightMeterHistory,
  createWateringHistory,
  getLightMeterHistory,
  getLightRecommendation,
  getWateringHistory,
  getWateringRecommendation,
} from "../controllers/home_tools_controller";

const router = Router();

router.get("/light-meter/history", protect, getLightMeterHistory);
router.post("/light-meter/history", protect, createLightMeterHistory);
router.get("/light-meter/recommendations/:plantId", protect, getLightRecommendation);

router.get("/watering/history", protect, getWateringHistory);
router.post("/watering/history", protect, createWateringHistory);
router.get("/watering/recommendations", protect, getWateringRecommendation);

export default router;

