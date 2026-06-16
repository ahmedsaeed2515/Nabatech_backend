import { Request, Response, RequestHandler } from 'express';
import { Article } from '../models/article_model';
import logger from '../logger';

// Get all published articles (with optional search and pagination)
export const getArticles: RequestHandler = async (req, res, next) => {
  try {
    const { query, limit = 10, page = 1 } = req.query;
    
    const filter: any = { isPublished: true };
    
    if (query && typeof query === 'string') {
      filter.$text = { $search: query };
    }

    const limitNum = parseInt(limit as string, 10);
    const pageNum = parseInt(page as string, 10);
    const skip = (pageNum - 1) * limitNum;

    let articlesQuery = Article.find(filter);
    
    if (query) {
      // Sort by text search score if searching
      articlesQuery = articlesQuery.sort({ score: { $meta: 'textScore' } });
    } else {
      // Sort by newest if no search query
      articlesQuery = articlesQuery.sort({ createdAt: -1 });
    }

    const articles = await articlesQuery.skip(skip).limit(limitNum);
    const total = await Article.countDocuments(filter);

    res.status(200).json({ 
      data: articles,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    logger.error('Error fetching articles:', error);
    next(error);
  }
};

// Get single article by ID
export const getArticleById: RequestHandler = async (req, res, next) => {
  try {
    const article = await Article.findOne({ _id: req.params.id, isPublished: true });
    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }
    res.status(200).json({ data: article });
  } catch (error) {
    logger.error('Error fetching article by ID:', error);
    next(error);
  }
};
