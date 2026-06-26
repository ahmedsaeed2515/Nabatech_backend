import { Request, Response, NextFunction } from "express";
import StoreProduct from "../models/store_product_model";
import Cart from "../models/cart_model";
import Order from "../models/order_model";
import { ok } from "../utils/api_response";

// --- Catalog ---

export const getCatalog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string, 10) || 1;
    const limit = parseInt(req.query.limit as string, 10) || 20;
    const skip = (page - 1) * limit;

    const query: any = { isActive: true, deletedAt: null };

    if (req.query.category) query.category = req.query.category;
    if (req.query.isFeatured) query.isFeatured = req.query.isFeatured === 'true';
    if (req.query.isBestSeller) query.isBestSeller = req.query.isBestSeller === 'true';
    if (req.query.search) query.name = { $regex: req.query.search, $options: "i" };

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

export const getProductDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await StoreProduct.findOne({ _id: req.params.id, isActive: true, deletedAt: null });
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });
    return ok(res, { product });
  } catch (error) {
    next(error);
  }
};

// --- Cart ---

export const getCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    let cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
      await cart.save();
    }
    return ok(res, { cart });
  } catch (error) {
    next(error);
  }
};

export const updateCart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const { items } = req.body; // Expects an array of { product: string, quantity: number }

    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({ user: userId, items: [] });
    }
    
    cart.items = items;
    await cart.save();
    
    // Populate products to return full details
    await cart.populate("items.product");

    return ok(res, { message: "Cart updated", cart });
  } catch (error) {
    next(error);
  }
};

// --- Orders ---

export const checkout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const { shippingAddress } = req.body;

    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ success: false, message: "Cart is empty" });
    }

    let totalAmount = 0;
    const orderItems = [];

    for (const item of cart.items) {
      const product: any = item.product;
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
      await StoreProduct.findByIdAndUpdate(product._id, { $inc: { stock: -item.quantity } });
    }

    const order = new Order({
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

    return ok(res, { message: "Checkout successful", order });
  } catch (error) {
    next(error);
  }
};

export const getMyOrders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const orders = await Order.find({ user: userId }).populate("items.product").sort({ createdAt: -1 });
    return ok(res, { orders });
  } catch (error) {
    next(error);
  }
};

export const getOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user._id;
    const order = await Order.findOne({ _id: req.params.id, user: userId }).populate("items.product");
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    return ok(res, { order });
  } catch (error) {
    next(error);
  }
};


