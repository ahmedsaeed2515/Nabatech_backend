import { Request, Response, NextFunction } from "express";
import HomeWidget from "../models/home_widget_model";
import HomeBanner from "../models/home_banner_model";
import HomeQuickAction from "../models/home_quick_action_model";
import HomeSection from "../models/home_section_model";
import HomeAnalytics from "../models/home_analytics_model";
import { ok } from "../utils/api_response";

// --- Generic CRUD Helper ---
const getGeneric = (Model: any) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await Model.find().sort({ order: 1, defaultOrder: 1, priority: -1, createdAt: -1 });
    return ok(res, { items });
  } catch (error) {
    next(error);
  }
};

const createGeneric = (Model: any) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await Model.create(req.body);
    return res.status(201).json({ success: true, item });
  } catch (error) {
    next(error);
  }
};

const updateGeneric = (Model: any) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await Model.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    return ok(res, { item });
  } catch (error) {
    next(error);
  }
};

const deleteGeneric = (Model: any) => async (req: Request, res: Response, next: NextFunction) => {
  try {
    const item = await Model.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: "Not found" });
    return ok(res, { message: "Deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// --- Controllers ---
export const getWidgets = getGeneric(HomeWidget);
export const createWidget = createGeneric(HomeWidget);
export const updateWidget = updateGeneric(HomeWidget);
export const deleteWidget = deleteGeneric(HomeWidget);

export const getBanners = getGeneric(HomeBanner);
export const createBanner = createGeneric(HomeBanner);
export const updateBanner = updateGeneric(HomeBanner);
export const deleteBanner = deleteGeneric(HomeBanner);

export const getQuickActions = getGeneric(HomeQuickAction);
export const createQuickAction = createGeneric(HomeQuickAction);
export const updateQuickAction = updateGeneric(HomeQuickAction);
export const deleteQuickAction = deleteGeneric(HomeQuickAction);

export const getSections = getGeneric(HomeSection);
export const createSection = createGeneric(HomeSection);
export const updateSection = updateGeneric(HomeSection);
export const deleteSection = deleteGeneric(HomeSection);

// --- Analytics ---
export const getHomeAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { from, to, type } = req.query;
    const match: any = {};
    
    if (type) match.entityType = type;
    if (from || to) {
      match.createdAt = {};
      if (from) match.createdAt.$gte = new Date(from as string);
      if (to) match.createdAt.$lte = new Date(to as string);
    }

    const views = await HomeAnalytics.countDocuments({ ...match, eventType: "view" });
    const clicks = await HomeAnalytics.countDocuments({ ...match, eventType: "click" });

    // Group by entity
    const performance = await HomeAnalytics.aggregate([
      { $match: match },
      { $group: { 
          _id: { entityId: "$entityId", eventType: "$eventType" }, 
          count: { $sum: 1 } 
      }},
    ]);

    return ok(res, { views, clicks, performance });
  } catch (error) {
    next(error);
  }
};
