"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const plant_library_controller_1 = require("../controllers/plant_library_controller");
const router = (0, express_1.Router)();
// Plants Routes
router.get("/plants/search", plant_library_controller_1.searchPlants);
router.get("/plants/stats", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.getPlantStats);
router.get("/plants/export", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.exportPlants);
router.get("/plants", plant_library_controller_1.getPlants);
router.get("/plants/:id", plant_library_controller_1.getPlantById);
router.post("/plants", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.addPlant);
router.put("/plants/:id", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.updatePlant);
router.delete("/plants/:id", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.deletePlant);
router.patch("/plants/:id/archive", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.archivePlant);
router.patch("/plants/:id/publish", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.publishPlant);
// Diseases Routes
router.get("/diseases", plant_library_controller_1.getDiseases);
router.post("/diseases", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.addDisease);
router.put("/diseases/:id", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.updateDisease);
router.delete("/diseases/:id", auth_middleware_1.protect, auth_middleware_1.admin, plant_library_controller_1.deleteDisease);
exports.default = router;
