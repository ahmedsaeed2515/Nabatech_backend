import { WishlistItemRepository } from '../repositories/WishlistItemRepository';
import { InventoryItemRepository } from '../repositories/InventoryItemRepository';
import { InventoryItemType } from '../models/inventory_item_model';

export class ToolingService {
  private wishlistRepo: WishlistItemRepository;
  private inventoryRepo: InventoryItemRepository;

  constructor() {
    this.wishlistRepo = new WishlistItemRepository();
    this.inventoryRepo = new InventoryItemRepository();
  }

  // --- Wishlist ---
  async getWishlist(userId: string) {
    return this.wishlistRepo.findByUser(userId);
  }

  async createWishlistItem(userId: string, species: string, notes?: string) {
    return this.wishlistRepo.create({
      user: userId as any,
      species,
      notes
    });
  }

  async updateWishlistItem(userId: string, id: string, updates: any) {
    const item = await this.wishlistRepo.findByUserAndId(userId, id);
    if (!item) throw new Error('Item not found');
    
    return this.wishlistRepo.update(id, updates);
  }

  async deleteWishlistItem(userId: string, id: string) {
    const item = await this.wishlistRepo.findByUserAndId(userId, id);
    if (!item) throw new Error('Item not found');
    
    return this.wishlistRepo.softDelete(id);
  }

  // --- Inventory ---
  async getInventory(userId: string) {
    return this.inventoryRepo.findByUser(userId);
  }

  async createInventoryItem(userId: string, type: InventoryItemType, name: string, qty: number) {
    return this.inventoryRepo.create({
      user: userId as any,
      type,
      name,
      qty
    });
  }

  async updateInventoryItem(userId: string, id: string, updates: any) {
    const item = await this.inventoryRepo.findByUserAndId(userId, id);
    if (!item) throw new Error('Item not found');
    
    return this.inventoryRepo.update(id, updates);
  }

  async deleteInventoryItem(userId: string, id: string) {
    const item = await this.inventoryRepo.findByUserAndId(userId, id);
    if (!item) throw new Error('Item not found');
    
    return this.inventoryRepo.softDelete(id);
  }
}
