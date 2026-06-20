"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteArticle = exports.updateArticle = exports.getAdminArticleById = exports.getAdminArticles = exports.createArticle = void 0;
var article_model_1 = require("../models/article_model");
var logger_1 = __importDefault(require("../logger"));
// Create a new article
var createArticle = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, body, imageUrl, url, source, isPublished, tags, parsedTags, article, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, title = _a.title, body = _a.body, imageUrl = _a.imageUrl, url = _a.url, source = _a.source, isPublished = _a.isPublished, tags = _a.tags;
                parsedTags = tags;
                if (typeof tags === 'string') {
                    parsedTags = tags.split(',').map(function (t) { return t.trim(); }).filter(function (t) { return t; });
                }
                article = new article_model_1.Article({
                    title: title,
                    body: body,
                    imageUrl: imageUrl,
                    url: url,
                    source: source,
                    isPublished: isPublished !== null && isPublished !== void 0 ? isPublished : true,
                    tags: parsedTags,
                });
                return [4 /*yield*/, article.save()];
            case 1:
                _b.sent();
                res.status(201).json({ message: 'Article created successfully', data: article });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _b.sent();
                logger_1.default.error('Error creating article:', error_1);
                next(error_1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.createArticle = createArticle;
// Get all articles (for admin, includes unpublished)
var getAdminArticles = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var articles, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, article_model_1.Article.find().sort({ createdAt: -1 })];
            case 1:
                articles = _a.sent();
                res.status(200).json({ data: articles });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _a.sent();
                logger_1.default.error('Error fetching admin articles:', error_2);
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAdminArticles = getAdminArticles;
// Get single article by ID
var getAdminArticleById = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var article, error_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, article_model_1.Article.findById(req.params.id)];
            case 1:
                article = _a.sent();
                if (!article) {
                    res.status(404).json({ message: 'Article not found' });
                    return [2 /*return*/];
                }
                res.status(200).json({ data: article });
                return [3 /*break*/, 3];
            case 2:
                error_3 = _a.sent();
                logger_1.default.error('Error fetching admin article by ID:', error_3);
                next(error_3);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.getAdminArticleById = getAdminArticleById;
// Update an article
var updateArticle = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, body, imageUrl, url, source, isPublished, tags, parsedTags, updateData, article, error_4;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, title = _a.title, body = _a.body, imageUrl = _a.imageUrl, url = _a.url, source = _a.source, isPublished = _a.isPublished, tags = _a.tags;
                parsedTags = tags;
                if (typeof tags === 'string') {
                    parsedTags = tags.split(',').map(function (t) { return t.trim(); }).filter(function (t) { return t; });
                }
                updateData = {
                    title: title,
                    body: body,
                    imageUrl: imageUrl,
                    url: url,
                    source: source,
                    isPublished: isPublished,
                };
                if (parsedTags) {
                    updateData.tags = parsedTags;
                }
                return [4 /*yield*/, article_model_1.Article.findByIdAndUpdate(req.params.id, { $set: updateData }, { new: true, runValidators: true })];
            case 1:
                article = _b.sent();
                if (!article) {
                    res.status(404).json({ message: 'Article not found' });
                    return [2 /*return*/];
                }
                res.status(200).json({ message: 'Article updated successfully', data: article });
                return [3 /*break*/, 3];
            case 2:
                error_4 = _b.sent();
                logger_1.default.error('Error updating article:', error_4);
                next(error_4);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.updateArticle = updateArticle;
// Delete an article
var deleteArticle = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var article, error_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, article_model_1.Article.findByIdAndDelete(req.params.id)];
            case 1:
                article = _a.sent();
                if (!article) {
                    res.status(404).json({ message: 'Article not found' });
                    return [2 /*return*/];
                }
                res.status(200).json({ message: 'Article deleted successfully' });
                return [3 /*break*/, 3];
            case 2:
                error_5 = _a.sent();
                logger_1.default.error('Error deleting article:', error_5);
                next(error_5);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.deleteArticle = deleteArticle;
