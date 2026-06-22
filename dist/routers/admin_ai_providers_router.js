"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../middlewares/auth_middleware");
const admin_ai_providers_controller_1 = require("../controllers/admin_ai_providers_controller");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect);
router.use((0, auth_middleware_1.authorizeRoles)("admin", "superadmin", "super_admin"));
router.get("/", admin_ai_providers_controller_1.getProviders);
router.post("/", admin_ai_providers_controller_1.createProvider);
router.get("/health", admin_ai_providers_controller_1.checkHealth);
router.get("/analytics", admin_ai_providers_controller_1.getAnalytics);
router.put("/:id", admin_ai_providers_controller_1.updateProvider);
router.post("/:id/test", admin_ai_providers_controller_1.testProvider);
exports.default = router;
