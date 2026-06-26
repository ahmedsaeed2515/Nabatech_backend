import express from "express";
import * as adminStoreController from "../controllers/admin_store_controller";
import { protect, admin } from "../middlewares/auth_middleware";

const router = express.Router();

// All routes are protected and require admin privileges
router.use(protect);
router.use(admin);

// Product Management
router.get("/products", adminStoreController.getProducts);
router.post("/products", adminStoreController.createProduct);
router.put("/products/:id", adminStoreController.updateProduct);
router.delete("/products/:id", adminStoreController.deleteProduct);
router.put("/products/:id/restore", adminStoreController.restoreProduct);

// Order Management
router.get("/orders", adminStoreController.getOrders);
router.put("/orders/:id/status", adminStoreController.updateOrderStatus);

// Analytics
router.get("/analytics", adminStoreController.getStoreAnalytics);

export default router;


