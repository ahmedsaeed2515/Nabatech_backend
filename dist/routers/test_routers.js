"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const test_controller_1 = require("../controllers/test_controller");
const router = (0, express_1.Router)();
router.get("/hello", test_controller_1.hello);
router.post("/echo", test_controller_1.echoBodey);
router.get("/get/:id", test_controller_1.getById);
exports.default = router;
