"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth_middleware");
const admin_cloudinary_controller_1 = require("../controllers/admin_cloudinary_controller");
const router = express_1.default.Router();
// Base protection
router.use(auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)("admin", "super_admin"));
// Phase 1 - Analytics
router.get("/stats", admin_cloudinary_controller_1.getCloudinaryStats);
// Phase 2 - Media Explorer
router.get("/assets", admin_cloudinary_controller_1.getAssets);
// Phase 3 - Folder Analytics
router.get("/folders", admin_cloudinary_controller_1.getFolderAnalytics);
// Phase 4 - Orphan Detector
router.get("/orphans", admin_cloudinary_controller_1.detectOrphans);
// Phase 8 - Super Admin Security (Destructive Operations)
router.post("/assets/delete", (0, auth_middleware_1.authorizeRoles)("super_admin"), admin_cloudinary_controller_1.deleteAsset);
router.post("/assets/bulk-delete", (0, auth_middleware_1.authorizeRoles)("super_admin"), admin_cloudinary_controller_1.bulkDeleteAssets);
router.post("/orphans/cleanup", (0, auth_middleware_1.authorizeRoles)("super_admin"), admin_cloudinary_controller_1.cleanupOrphans);
exports.default = router;
