"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const diagnosis_controller_1 = require("../controllers/diagnosis_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const router = (0, express_1.Router)();
router.post("/sync-offline", auth_middleware_1.protect, diagnosis_controller_1.syncOfflineDiagnosis);
router.get("/:historyId/advice", auth_middleware_1.protect, diagnosis_controller_1.generateDiagnosisAdvice);
exports.default = router;
