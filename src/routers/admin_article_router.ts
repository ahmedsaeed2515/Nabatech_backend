import { Router } from 'express';
import {
  createArticle,
  getAdminArticles,
  getAdminArticleById,
  updateArticle,
  deleteArticle,
} from '../controllers/admin_article_controller';

const router = Router();

// Routes for /api/admin/articles
router.post('/', createArticle);
router.get('/', getAdminArticles);
router.get('/:id', getAdminArticleById);
router.put('/:id', updateArticle);
router.delete('/:id', deleteArticle);

export default router;
