"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var admin_diagnosis_controller_1 = require("../controllers/admin_diagnosis_controller");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var validate_request_middleware_1 = require("../middlewares/validate_request_middleware");
var history_schemas_1 = require("../validation/history_schemas");
var router = (0, express_1.Router)();
// Base route is /api/admin/diagnoses
router.get("/", auth_middleware_1.protect, auth_middleware_1.admin, (0, validate_request_middleware_1.validateRequest)(history_schemas_1.adminDiagnosisQuerySchema), admin_diagnosis_controller_1.getAdminDiagnoses);
router.get("/analytics", auth_middleware_1.protect, auth_middleware_1.admin, (0, validate_request_middleware_1.validateRequest)(history_schemas_1.adminDiagnosisAnalyticsQuerySchema), admin_diagnosis_controller_1.getAdminDiagnosisAnalytics);
exports.default = router;
