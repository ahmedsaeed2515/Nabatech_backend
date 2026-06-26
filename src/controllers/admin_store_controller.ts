import { Request, Response, NextFunction } from "express";
import StoreProduct from "../models/store_product_model";
import Order from "../models/order_model";
import { ok } from "../utils/api_response";

// --- Products ---

export const getProducts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const query: any = { deletedAt: null };

    if (req.query.search) {
      query.name = { $regex: req.query.search, $options: "i" };
    }

    const total = await StoreProduct.countDocuments(query);
    const products = await StoreProduct.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit);

    return ok(res, {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const createProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = new StoreProduct(req.body);
    await product.save();
    return ok(res, { message: "Product created", product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await StoreProduct.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return ok(res, { message: "Product updated", product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Soft delete
    const product = await StoreProduct.findByIdAndUpdate(req.params.id, { deletedAt: new Date() }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return ok(res, { message: "Product deleted", product });
  } catch (error) {
    next(error);
  }
};

export const restoreProduct = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await StoreProduct.findByIdAndUpdate(req.params.id, { $unset: { deletedAt: 1 } }, { new: true });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return ok(res, { message: "Product restored", product });
  } catch (error) {
    next(error);
  }
};

// --- Orders ---

export const getOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const total = await Order.countDocuments();
    const orders = await Order.find().populate("user", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit);

    return ok(res, {
      total,
      page,
      totalPages: Math.ceil(total / limit),
      orders,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, paymentStatus } = req.body;
    const update: any = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;

    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    return ok(res, { message: "Order updated", order });
  } catch (error) {
    next(error);
  }
};

// --- Analytics ---

export const getStoreAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalOrders = await Order.countDocuments();
    const orders = await Order.find({ paymentStatus: "paid" });
    const revenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

    const lowStockProducts = await StoreProduct.find({ stock: { $lt: 10 }, deletedAt: null }).select("name stock");

    return ok(res, {
      totalOrders,
      revenue,
      lowStockProducts,
    });
  } catch (error) {
    next(error);
  }
};


