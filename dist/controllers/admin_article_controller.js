"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteArticle = exports.updateArticle = exports.getAdminArticleById = exports.getAdminArticles = exports.createArticle = void 0;
const article_model_1 = require("../models/article_model");
const logger_1 = __importDefault(require("../logger"));
// Create a new article
const createArticle = async (req, res, next) => {
    try {
        const { title, body, imageUrl, url, source, isPublished, tags } = req.body;
        // Convert comma-separated tags to array if string
        let parsedTags = tags;
        if (typeof tags === 'string') {
            parsedTags = tags.split(',').map(t => t.trim()).filter(t => t);
        }
        const article = new article_model_1.Article({
            title,
            body,
            imageUrl,
            url,
            source,
            isPublished: isPublished ?? true,
            tags: parsedTags,
        });
        await article.save();
        res.status(201).json({ message: 'Article created successfully', data: article });
    }
    catch (error) {
        logger_1.default.error('Error creating article:', error);
        next(error);
    }
};
exports.createArticle = createArticle;
// Get all articles (for admin, includes unpublished)
const getAdminArticles = async (req, res, next) => {
    try {
        const articles = await article_model_1.Article.find().sort({ createdAt: -1 });
        res.status(200).json({ data: articles });
    }
    catch (error) {
        logger_1.default.error('Error fetching admin articles:', error);
        next(error);
    }
};
exports.getAdminArticles = getAdminArticles;
// Get single article by ID
const getAdminArticleById = async (req, res, next) => {
    try {
        const article = await article_model_1.Article.findById(req.params.id);
        if (!article) {
            res.status(404).json({ message: 'Article not found' });
            return;
        }
        res.status(200).json({ data: article });
    }
    catch (error) {
        logger_1.default.error('Error fetching admin article by ID:', error);
        next(error);
    }
};
exports.getAdminArticleById = getAdminArticleById;
// Update an article
const updateArticle = async (req, res, next) => {
    try {
        const { title, body, imageUrl, url, source, isPublished, tags } = req.body;
        let parsedTags = tags;
        if (typeof tags === 'string') {
            parsedTags = tags.split(',').map(t => t.trim()).filter(t => t);
        }
        const updateData = {
            title,
            body,
            imageUrl,
            url,
            source,
            isPublished,
        };
        if (parsedTags) {
            updateData.tags = parsedTags;
        }
        const article = await article_model_1.Article.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true });
        if (!article) {
            res.status(404).json({ message: 'Article not found' });
            return;
        }
        res.status(200).json({ message: 'Article updated successfully', data: article });
    }
    catch (error) {
        logger_1.default.error('Error updating article:', error);
        next(error);
    }
};
exports.updateArticle = updateArticle;
// Delete an article
const deleteArticle = async (req, res, next) => {
    try {
        const article = await article_model_1.Article.findByIdAndDelete(req.params.id);
        if (!article) {
            res.status(404).json({ message: 'Article not found' });
            return;
        }
        res.status(200).json({ message: 'Article deleted successfully' });
    }
    catch (error) {
        logger_1.default.error('Error deleting article:', error);
        next(error);
    }
};
exports.deleteArticle = deleteArticle;
