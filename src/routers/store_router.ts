import express from "express";
import * as storeController from "../controllers/store_controller";
import { protect } from "../middlewares/auth_middleware";

const router = express.Router();

// Public Catalog
router.get("/catalog", storeController.getCatalog);
router.get("/catalog/:id", storeController.getProductDetails);

// Protected Cart & Checkout
router.use(protect);
router.get("/cart", storeController.getCart);
router.put("/cart", storeController.updateCart);

router.post("/checkout", storeController.checkout);
router.get("/orders", storeController.getMyOrders);
router.get("/orders/:id", storeController.getOrderDetails);

export default router;
