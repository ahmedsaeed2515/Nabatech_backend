"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const diagnosis_controller_1 = require("../controllers/diagnosis_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const upload_middleware_1 = __importDefault(require("../middlewares/upload_middleware"));
const router = (0, express_1.Router)();
router.post("/predict", auth_middleware_1.protect, upload_middleware_1.default.single("file"), diagnosis_controller_1.predictPlantDisease);
router.post("/sync-offline", auth_middleware_1.protect, diagnosis_controller_1.syncOfflineDiagnosis);
router.get("/:historyId/advice", auth_middleware_1.protect, diagnosis_controller_1.generateDiagnosisAdvice);
exports.default = router;
