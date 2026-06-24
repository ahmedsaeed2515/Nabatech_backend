"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderDetails = exports.getMyOrders = exports.checkout = exports.updateCart = exports.getCart = exports.getProductDetails = exports.getCatalog = void 0;
const store_product_model_1 = __importDefault(require("../models/store_product_model"));
const cart_model_1 = __importDefault(require("../models/cart_model"));
const order_model_1 = __importDefault(require("../models/order_model"));
const api_response_1 = require("../utils/api_response");
// --- Catalog ---
const getCatalog = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const query = { isActive: true, deletedAt: null };
        if (req.query.category)
            query.category = req.query.category;
        if (req.query.isFeatured)
            query.isFeatured = req.query.isFeatured === 'true';
        if (req.query.isBestSeller)
            query.isBestSeller = req.query.isBestSeller === 'true';
        if (req.query.search)
            query.name = { $regex: req.query.search, $options: "i" };
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
exports.getCatalog = getCatalog;
const getProductDetails = async (req, res, next) => {
    try {
        const product = await store_product_model_1.default.findOne({ _id: req.params.id, isActive: true, deletedAt: null });
        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });
        return (0, api_response_1.ok)(res, { product });
    }
    catch (error) {
        next(error);
    }
};
exports.getProductDetails = getProductDetails;
// --- Cart ---
const getCart = async (req, res, next) => {
    try {
        const userId = req.user._id;
        let cart = await cart_model_1.default.findOne({ user: userId }).populate("items.product");
        if (!cart) {
            cart = new cart_model_1.default({ user: userId, items: [] });
            await cart.save();
        }
        return (0, api_response_1.ok)(res, { cart });
    }
    catch (error) {
        next(error);
    }
};
exports.getCart = getCart;
const updateCart = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { items } = req.body; // Expects an array of { product: string, quantity: number }
        let cart = await cart_model_1.default.findOne({ user: userId });
        if (!cart) {
            cart = new cart_model_1.default({ user: userId, items: [] });
        }
        cart.items = items;
        await cart.save();
        // Populate products to return full details
        await cart.populate("items.product");
        return (0, api_response_1.ok)(res, { message: "Cart updated", cart });
    }
    catch (error) {
        next(error);
    }
};
exports.updateCart = updateCart;
// --- Orders ---
const checkout = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const { shippingAddress } = req.body;
        const cart = await cart_model_1.default.findOne({ user: userId }).populate("items.product");
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ success: false, message: "Cart is empty" });
        }
        let totalAmount = 0;
        const orderItems = [];
        for (const item of cart.items) {
            const product = item.product;
            const price = product.salePrice || product.price;
            // Stock check
            if (product.stock < item.quantity) {
                return res.status(400).json({ success: false, message: `Not enough stock for ${product.name}` });
            }
            orderItems.push({
                product: product._id,
                quantity: item.quantity,
                priceAtPurchase: price,
            });
            totalAmount += price * item.quantity;
            // Deduct stock
            await store_product_model_1.default.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
        }
        const order = new order_model_1.default({
            user: userId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            status: "pending",
            paymentStatus: "paid", // Mocking payment as paid directly for now
        });
        await order.save();
        // Clear the cart
        cart.items = [];
        await cart.save();
        return (0, api_response_1.ok)(res, { message: "Checkout successful", order });
    }
    catch (error) {
        next(error);
    }
};
exports.checkout = checkout;
const getMyOrders = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const orders = await order_model_1.default.find({ user: userId }).populate("items.product").sort({ createdAt: -1 });
        return (0, api_response_1.ok)(res, { orders });
    }
    catch (error) {
        next(error);
    }
};
exports.getMyOrders = getMyOrders;
const getOrderDetails = async (req, res, next) => {
    try {
        const userId = req.user._id;
        const order = await order_model_1.default.findOne({ _id: req.params.id, user: userId }).populate("items.product");
        if (!order)
            return res.status(404).json({ success: false, message: "Order not found" });
        return (0, api_response_1.ok)(res, { order });
    }
    catch (error) {
        next(error);
    }
};
exports.getOrderDetails = getOrderDetails;
