import { Router } from "express";
import { 
  getStoreProducts, 
  getExperts, 
  getOutbreaks,
  createStoreProduct,
  deleteStoreProduct,
  createExpert,
  deleteExpert 
} from "../controllers/explore_controller";
import { protect, admin } from "../middlewares/auth_middleware";

const router = Router();

router.get("/store-products", getStoreProducts);
router.post("/store-products", protect, admin, createStoreProduct);
router.delete("/store-products/:id", protect, admin, deleteStoreProduct);

router.get("/experts", getExperts);
router.post("/experts", protect, admin, createExpert);
router.delete("/experts/:id", protect, admin, deleteExpert);

router.get("/outbreaks", getOutbreaks);

export default router;

