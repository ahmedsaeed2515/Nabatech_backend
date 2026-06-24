"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth_middleware");
const admin_database_controller_1 = require("../controllers/admin_database_controller");
const router = express_1.default.Router();
// All routes here are protected and require admin or super_admin
router.use(auth_middleware_1.protect, (0, auth_middleware_1.authorizeRoles)("admin", "super_admin"));
// Phase 1 - DB Analytics
router.get("/stats", admin_database_controller_1.getDatabaseStats);
// Phase 2 - Collection Explorer
router.get("/collections", admin_database_controller_1.getCollections);
// Phase 4 - Storage Analyzer
router.get("/storage-analyzer", admin_database_controller_1.getStorageAnalyzer);
// Phase 5 - Cleanup Center
router.post("/cleanup", admin_database_controller_1.cleanupDatabase);
// Phase 3 - Collection Details (Parameter route usually placed later to avoid clashing)
router.get("/collections/:name", admin_database_controller_1.getCollectionDetails);
// Phase 6 - Super Admin Operations (Override role for specific destructive endpoints)
// We add authorizeRoles("super_admin") specifically here. Express will run both middlewares,
// so if user is 'admin', the first passes, but this second one will reject.
router.delete("/collections/:name/drop", (0, auth_middleware_1.authorizeRoles)("super_admin"), admin_database_controller_1.dropCollection);
router.delete("/collections/:name/purge", (0, auth_middleware_1.authorizeRoles)("super_admin"), admin_database_controller_1.purgeCollection);
exports.default = router;
