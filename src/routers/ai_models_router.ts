import { Router } from "express";
import { admin, protect } from "../middlewares/auth_middleware";
import {
  createAiModelManifestItem,
  deleteAiModelManifestItem,
  getAiModelProxyUrl,
  getAiModelsManifest,
  updateAiModelManifestItem,
} from "../controllers/ai_models_controller";

const router = Router();

router.get("/manifest", getAiModelsManifest);
router.get("/manifest/:id/proxy-url", protect, getAiModelProxyUrl);
router.post("/manifest", protect, admin, createAiModelManifestItem);
router.put("/manifest/:id", protect, admin, updateAiModelManifestItem);
router.delete("/manifest/:id", protect, admin, deleteAiModelManifestItem);

export default router;



