"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var diagnosis_controller_1 = require("../controllers/diagnosis_controller");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var upload_middleware_1 = __importDefault(require("../middlewares/upload_middleware")); // Assuming it exists
var router = (0, express_1.Router)();
router.post("/sync-offline", auth_middleware_1.protect, upload_middleware_1.default.single("image"), diagnosis_controller_1.syncOfflineDiagnosis);
router.post("/predict", auth_middleware_1.protect, upload_middleware_1.default.single("image"), diagnosis_controller_1.predictOnline);
router.get("/:historyId/advice", auth_middleware_1.protect, diagnosis_controller_1.generateDiagnosisAdvice);
exports.default = router;
