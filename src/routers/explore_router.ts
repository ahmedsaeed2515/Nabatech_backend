import { Router } from "express";
// import { validateRequest } from "../middlewares/validate_request_middleware"; // removed to avoid undefined error
import { arScanListSchema, arScanCreateSchema } from "../validation/ar_scan_schemas";
import { 
  getStoreProducts, 
  getExperts, 
  getOutbreaks,
  createStoreProduct,
  deleteStoreProduct,
  createExpert,
  deleteExpert,
  createOutbreak,
  deleteOutbreak,
  updateOutbreak
} from "../controllers/explore_controller";
import { createArScanSession, getArScanSessions } from "../controllers/ar_scan_controller";
import { protect, admin } from "../middlewares/auth_middleware";

const router = Router();

router.get("/store-products", getStoreProducts);
router.post("/store-products", protect, admin, createStoreProduct);
router.delete("/store-products/:id", protect, admin, deleteStoreProduct);

router.get("/experts", getExperts);
router.post("/experts", protect, admin, createExpert);
router.delete("/experts/:id", protect, admin, deleteExpert);

// Outbreaks routes
router.get("/outbreaks", getOutbreaks);
router.post("/outbreaks", protect, admin, createOutbreak);
router.put("/outbreaks/:id", protect, admin, updateOutbreak);
router.delete("/outbreaks/:id", protect, admin, deleteOutbreak);
// router.get('/ar-scan-sessions', protect, (req, res, next) => next(), getArScanSessions);
// router.post('/ar-scan-sessions', protect, (req, res, next) => next(), createArScanSession);

export default router;
