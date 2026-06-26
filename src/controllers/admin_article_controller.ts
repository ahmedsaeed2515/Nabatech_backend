import { Request, Response, RequestHandler } from 'express';
import { Article } from '../models/article_model';
import logger from '../logger';

// Create a new article
export const createArticle: RequestHandler = async (req, res, next) => {
  try {
    const { title, body, imageUrl, url, source, isPublished, tags } = req.body;
    
    // Convert comma-separated tags to array if string
    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(t => t.trim()).filter(t => t);
    }

    const article = new Article({
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
  } catch (error) {
    logger.error('Error creating article:', error);
    next(error);
  }
};

// Get all articles (for admin, includes unpublished)
export const getAdminArticles: RequestHandler = async (req, res, next) => {
  try {
    const articles = await Article.find().sort({ createdAt: -1 });
    res.status(200).json({ data: articles });
  } catch (error) {
    logger.error('Error fetching admin articles:', error);
    next(error);
  }
};

// Get single article by ID
export const getAdminArticleById: RequestHandler = async (req, res, next) => {
  try {
    const article = await Article.findById(req.params.id);
    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }
    res.status(200).json({ data: article });
  } catch (error) {
    logger.error('Error fetching admin article by ID:', error);
    next(error);
  }
};

// Update an article
export const updateArticle: RequestHandler = async (req, res, next) => {
  try {
    const { title, body, imageUrl, url, source, isPublished, tags } = req.body;

    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(t => t.trim()).filter(t => t);
    }

    const updateData: any = {
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

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }

    res.status(200).json({ message: 'Article updated successfully', data: article });
  } catch (error) {
    logger.error('Error updating article:', error);
    next(error);
  }
};

// Delete an article
export const deleteArticle: RequestHandler = async (req, res, next) => {
  try {
    const article = await Article.findByIdAndDelete(req.params.id);
    if (!article) {
      res.status(404).json({ message: 'Article not found' });
      return;
    }
    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    logger.error('Error deleting article:', error);
    next(error);
  }
};


