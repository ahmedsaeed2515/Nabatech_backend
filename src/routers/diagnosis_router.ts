import { Router } from "express";
import { predictPlantDisease } from "../controllers/diagnosis_controller";
import { protect } from "../middlewares/auth_middleware";
import upload from "../middlewares/upload_middleware";

const router = Router();

router.post("/predict", protect, upload.single("file"), predictPlantDisease);

export default router;
