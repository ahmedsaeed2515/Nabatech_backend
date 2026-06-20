"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var validate_request_middleware_1 = require("../middlewares/validate_request_middleware");
var home_tools_controller_1 = require("../controllers/home_tools_controller");
var home_tools_schemas_1 = require("../validation/home_tools_schemas");
var router = (0, express_1.Router)();
// Feed
router.get("/feed", auth_middleware_1.protect, home_tools_controller_1.getHomeFeed);
router.post("/track", auth_middleware_1.protect, home_tools_controller_1.trackHomeEvent);
router.get("/light-meter/history", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(home_tools_schemas_1.paginationQuerySchema), home_tools_controller_1.getLightMeterHistory);
router.post("/light-meter/history", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(home_tools_schemas_1.lightMeterHistorySchema), home_tools_controller_1.createLightMeterHistory);
router.get("/light-meter/recommendations/:plantId", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(home_tools_schemas_1.lightRecommendationSchema), home_tools_controller_1.getLightRecommendation);
router.get("/watering/history", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(home_tools_schemas_1.paginationQuerySchema), home_tools_controller_1.getWateringHistory);
router.post("/watering/history", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(home_tools_schemas_1.wateringHistorySchema), home_tools_controller_1.createWateringHistory);
router.get("/watering/recommendations", auth_middleware_1.protect, (0, validate_request_middleware_1.validateRequest)(home_tools_schemas_1.wateringRecommendationSchema), home_tools_controller_1.getWateringRecommendation);
exports.default = router;
