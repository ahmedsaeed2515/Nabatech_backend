"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolingService = void 0;
const WishlistItemRepository_1 = require("../repositories/WishlistItemRepository");
const InventoryItemRepository_1 = require("../repositories/InventoryItemRepository");
class ToolingService {
    constructor() {
        this.wishlistRepo = new WishlistItemRepository_1.WishlistItemRepository();
        this.inventoryRepo = new InventoryItemRepository_1.InventoryItemRepository();
    }
    // --- Wishlist ---
    async getWishlist(userId) {
        return this.wishlistRepo.findByUser(userId);
    }
    async createWishlistItem(userId, species, notes) {
        return this.wishlistRepo.create({
            user: userId,
            species,
            notes
        });
    }
    async updateWishlistItem(userId, id, updates) {
        const item = await this.wishlistRepo.findByUserAndId(userId, id);
        if (!item)
            throw new Error('Item not found');
        return this.wishlistRepo.update(id, updates);
    }
    async deleteWishlistItem(userId, id) {
        const item = await this.wishlistRepo.findByUserAndId(userId, id);
        if (!item)
            throw new Error('Item not found');
        return this.wishlistRepo.softDelete(id);
    }
    // --- Inventory ---
    async getInventory(userId) {
        return this.inventoryRepo.findByUser(userId);
    }
    async createInventoryItem(userId, type, name, qty) {
        return this.inventoryRepo.create({
            user: userId,
            type,
            name,
            qty
        });
    }
    async updateInventoryItem(userId, id, updates) {
        const item = await this.inventoryRepo.findByUserAndId(userId, id);
        if (!item)
            throw new Error('Item not found');
        return this.inventoryRepo.update(id, updates);
    }
    async deleteInventoryItem(userId, id) {
        const item = await this.inventoryRepo.findByUserAndId(userId, id);
        if (!item)
            throw new Error('Item not found');
        return this.inventoryRepo.softDelete(id);
    }
}
exports.ToolingService = ToolingService;
