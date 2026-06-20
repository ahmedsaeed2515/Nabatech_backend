"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var auth_middleware_1 = require("../middlewares/auth_middleware");
var plant_library_controller_1 = require("../controllers/plant_library_controller");
var router = (0, express_1.Router)();
// Wildcard text search for admin
router.get("/search", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.adminSearchPlants);
// Bulk import route (admin only)
router.post("/imports", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.bulkImport);
exports.default = router;
