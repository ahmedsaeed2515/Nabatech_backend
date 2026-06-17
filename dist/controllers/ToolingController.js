"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolingController = void 0;
const ToolingService_1 = require("../services/ToolingService");
class ToolingController {
    constructor() {
        // --- Wishlist ---
        this.getWishlist = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const data = await this.toolingService.getWishlist(userId);
                res.status(200).json({ status: 'success', data });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.createWishlistItem = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const { species, notes } = req.body;
                const item = await this.toolingService.createWishlistItem(userId, species, notes);
                res.status(201).json({ status: 'success', data: item });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.updateWishlistItem = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const { id } = req.params;
                const item = await this.toolingService.updateWishlistItem(userId, id, req.body);
                res.status(200).json({ status: 'success', data: item });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.deleteWishlistItem = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const { id } = req.params;
                await this.toolingService.deleteWishlistItem(userId, id);
                res.status(200).json({ status: 'success', message: 'Item deleted' });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        // --- Inventory ---
        this.getInventory = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const data = await this.toolingService.getInventory(userId);
                res.status(200).json({ status: 'success', data });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.createInventoryItem = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const { type, name, qty } = req.body;
                const item = await this.toolingService.createInventoryItem(userId, type, name, qty);
                res.status(201).json({ status: 'success', data: item });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.updateInventoryItem = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const { id } = req.params;
                const item = await this.toolingService.updateInventoryItem(userId, id, req.body);
                res.status(200).json({ status: 'success', data: item });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.deleteInventoryItem = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const { id } = req.params;
                await this.toolingService.deleteInventoryItem(userId, id);
                res.status(200).json({ status: 'success', message: 'Item deleted' });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.toolingService = new ToolingService_1.ToolingService();
    }
}
exports.ToolingController = ToolingController;
