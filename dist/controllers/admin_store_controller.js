"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStoreAnalytics = exports.updateOrderStatus = exports.getOrders = exports.restoreProduct = exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getProducts = void 0;
const store_product_model_1 = __importDefault(require("../models/store_product_model"));
const order_model_1 = __importDefault(require("../models/order_model"));
const api_response_1 = require("../utils/api_response");
// --- Products ---
const getProducts = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const query = { deletedAt: null };
        if (req.query.search) {
            query.name = { $regex: req.query.search, $options: "i" };
        }
        const total = await store_product_model_1.default.countDocuments(query);
        const products = await store_product_model_1.default.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);
        return (0, api_response_1.ok)(res, {
            total,
            page,
            totalPages: Math.ceil(total / limit),
            products,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getProducts = getProducts;
const createProduct = async (req, res, next) => {
    try {
        const product = new store_product_model_1.default(req.body);
        await product.save();
        return (0, api_response_1.ok)(res, { message: "Product created", product });
    }
    catch (error) {
        next(error);
    }
};
exports.createProduct = createProduct;
const updateProduct = async (req, res, next) => {
    try {
        const product = await store_product_model_1.default.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });
        return (0, api_response_1.ok)(res, { message: "Product updated", product });
    }
    catch (error) {
        next(error);
    }
};
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res, next) => {
    try {
        // Soft delete
        const product = await store_product_model_1.default.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true });
        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });
        return (0, api_response_1.ok)(res, { message: "Product deleted", product });
    }
    catch (error) {
        next(error);
    }
};
exports.deleteProduct = deleteProduct;
const restoreProduct = async (req, res, next) => {
    try {
        const product = await store_product_model_1.default.findByIdAndUpdate(req.params.id, { $unset: { deletedAt: 1 } }, { new: true });
        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });
        return (0, api_response_1.ok)(res, { message: "Product restored", product });
    }
    catch (error) {
        next(error);
    }
};
exports.restoreProduct = restoreProduct;
// --- Orders ---
const getOrders = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const total = await order_model_1.default.countDocuments();
        const orders = await order_model_1.default.find().populate("user", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit);
        return (0, api_response_1.ok)(res, {
            total,
            page,
            totalPages: Math.ceil(total / limit),
            orders,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrders = getOrders;
const updateOrderStatus = async (req, res, next) => {
    try {
        const { status, paymentStatus } = req.body;
        const update = {};
        if (status)
            update.status = status;
        if (paymentStatus)
            update.paymentStatus = paymentStatus;
        const order = await order_model_1.default.findByIdAndUpdate(req.params.id, update, { new: true });
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });
        return (0, api_response_1.ok)(res, { message: "Order updated", order });
    }
    catch (error) {
        next(error);
    }
};
exports.updateOrderStatus = updateOrderStatus;
// --- Analytics ---
const getStoreAnalytics = async (req, res, next) => {
    try {
        const totalOrders = await order_model_1.default.countDocuments();
        const orders = await order_model_1.default.find({ paymentStatus: "paid" });
        const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
        const lowStockProducts = await store_product_model_1.default.find({ stock: { $lt: 10 }, deletedAt: null }).select("name stock");
        return (0, api_response_1.ok)(res, {
            totalOrders,
            revenue,
            lowStockProducts,
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getStoreAnalytics = getStoreAnalytics;
