"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminStoreController = __importStar(require("../controllers/admin_store_controller"));
const auth_middleware_1 = require("../middlewares/auth_middleware");
const router = express_1.default.Router();
// All routes are protected and require admin privileges
router.use(auth_middleware_1.protect);
router.use(auth_middleware_1.admin);
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
exports.default = router;
