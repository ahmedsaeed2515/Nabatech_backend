import { Router } from 'express';
import { getArticles, getArticleById } from '../controllers/article_controller';

const router = Router();

// Routes for /api/articles
router.get('/', getArticles);
router.get('/:id', getArticleById);

export default router;


