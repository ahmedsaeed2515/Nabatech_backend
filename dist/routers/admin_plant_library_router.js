"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const plant_library_controller_1 = require("../controllers/plant_library_controller");
const router = (0, express_1.Router)();
// Wildcard text search for admin
router.get("/search", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.adminSearchPlants);
// Bulk import route (admin only)
router.post("/imports", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.bulkImport);
exports.default = router;
