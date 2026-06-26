import { BaseRepository } from './BaseRepository';
import WishlistItemModel, { WishlistItem } from '../models/wishlist_item_model';

export class WishlistItemRepository extends BaseRepository<WishlistItem> {
  constructor() {
    super(WishlistItemModel);
  }

  async findByUser(userId: string): Promise<WishlistItem[]> {
    return this.model.find({ user: userId }).sort({ createdAt: -1 }).exec();
  }

  async findByUserAndId(userId: string, id: string): Promise<WishlistItem | null> {
    return this.model.findOne({ _id: id, user: userId }).exec();
  }
}


