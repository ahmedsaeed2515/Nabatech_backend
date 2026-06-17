"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getArticleById = exports.getArticles = void 0;
const article_model_1 = require("../models/article_model");
const logger_1 = __importDefault(require("../logger"));
// Get all published articles (with optional search and pagination)
const getArticles = async (req, res, next) => {
    try {
        const { query, limit = 10, page = 1 } = req.query;
        const filter = { isPublished: true };
        if (query && typeof query === 'string') {
            filter.$text = { $search: query };
        }
        const limitNum = parseInt(limit, 10);
        const pageNum = parseInt(page, 10);
        const skip = (pageNum - 1) * limitNum;
        let articlesQuery = article_model_1.Article.find(filter);
        if (query) {
            // Sort by text search score if searching
            articlesQuery = articlesQuery.sort({ score: { $meta: 'textScore' } });
        }
        else {
            // Sort by newest if no search query
            articlesQuery = articlesQuery.sort({ createdAt: -1 });
        }
        const articles = await articlesQuery.skip(skip).limit(limitNum);
        const total = await article_model_1.Article.countDocuments(filter);
        res.status(200).json({
            data: articles,
            pagination: {
                total,
                page: pageNum,
                pages: Math.ceil(total / limitNum)
            }
        });
    }
    catch (error) {
        logger_1.default.error('Error fetching articles:', error);
        next(error);
    }
};
exports.getArticles = getArticles;
// Get single article by ID
const getArticleById = async (req, res, next) => {
    try {
        const article = await article_model_1.Article.findOne({ _id: req.params.id, isPublished: true });
        if (!article) {
            res.status(404).json({ message: 'Article not found' });
            return;
        }
        res.status(200).json({ data: article });
    }
    catch (error) {
        logger_1.default.error('Error fetching article by ID:', error);
        next(error);
    }
};
exports.getArticleById = getArticleById;
