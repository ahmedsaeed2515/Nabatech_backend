import { Request, Response } from 'express';
import { ToolingService } from '../services/ToolingService';

export class ToolingController {
  private toolingService: ToolingService;

  constructor() {
    this.toolingService = new ToolingService();
  }

  // --- Wishlist ---
  getWishlist = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const data = await this.toolingService.getWishlist(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  createWishlistItem = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const { species, notes } = req.body;
      const item = await this.toolingService.createWishlistItem(userId, species, notes);
      res.status(201).json({ status: 'success', data: item });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  updateWishlistItem = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const { id } = req.params;
      const item = await this.toolingService.updateWishlistItem(userId, id as string, req.body);
      res.status(200).json({ status: 'success', data: item });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  deleteWishlistItem = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const { id } = req.params;
      await this.toolingService.deleteWishlistItem(userId, id as string);
      res.status(200).json({ status: 'success', message: 'Item deleted' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  // --- Inventory ---
  getInventory = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const data = await this.toolingService.getInventory(userId);
      res.status(200).json({ status: 'success', data });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  createInventoryItem = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const { type, name, qty } = req.body;
      const item = await this.toolingService.createInventoryItem(userId, type, name, qty);
      res.status(201).json({ status: 'success', data: item });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  updateInventoryItem = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const { id } = req.params;
      const item = await this.toolingService.updateInventoryItem(userId, id as string, req.body);
      res.status(200).json({ status: 'success', data: item });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  deleteInventoryItem = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const { id } = req.params;
      await this.toolingService.deleteInventoryItem(userId, id as string);
      res.status(200).json({ status: 'success', message: 'Item deleted' });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}
