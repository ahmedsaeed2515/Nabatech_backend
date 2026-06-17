"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_my_plants_controller_1 = require("../controllers/admin_my_plants_controller");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const router = (0, express_1.Router)();
router.get("/", auth_middleware_1.protect, auth_middleware_1.admin, admin_my_plants_controller_1.getAdminPlants);
router.delete("/:id", auth_middleware_1.protect, auth_middleware_1.admin, admin_my_plants_controller_1.deleteAdminPlant);
exports.default = router;
