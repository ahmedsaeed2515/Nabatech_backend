import { BaseRepository } from './BaseRepository';
import InventoryItemModel, { InventoryItem } from '../models/inventory_item_model';

export class InventoryItemRepository extends BaseRepository<InventoryItem> {
  constructor() {
    super(InventoryItemModel);
  }

  async findByUser(userId: string): Promise<InventoryItem[]> {
    return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }

  async findByUserAndId(userId: string, id: string): Promise<InventoryItem | null> {
    return this.model.findOne({ _id: id, user: userId }).exec();
  }
}
