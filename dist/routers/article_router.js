"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const article_controller_1 = require("../controllers/article_controller");
const router = (0, express_1.Router)();
// Routes for /api/articles
router.get('/', article_controller_1.getArticles);
router.get('/:id', article_controller_1.getArticleById);
exports.default = router;
