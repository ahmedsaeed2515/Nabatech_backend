"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_article_controller_1 = require("../controllers/admin_article_controller");
const router = (0, express_1.Router)();
// Routes for /api/admin/articles
router.post('/', admin_article_controller_1.createArticle);
router.get('/', admin_article_controller_1.getAdminArticles);
router.get('/:id', admin_article_controller_1.getAdminArticleById);
router.put('/:id', admin_article_controller_1.updateArticle);
router.delete('/:id', admin_article_controller_1.deleteArticle);
exports.default = router;
