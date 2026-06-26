import { Request, Response, NextFunction } from "express";
import ExploreSection from "../models/explore_section_model";
import ExplorePlacement from "../models/explore_placement_model";
import ExploreClickEvent from "../models/explore_click_event_model";
import StoreProduct from "../models/store_product_model";
import ExpertProfile from "../models/expert_profile_model";
import OutbreakSpot from "../models/outbreak_spot_model";
import User from "../models/user_model";
import { Article } from "../models/article_model";
import { AiRecommendationService } from "../services/AiRecommendationService";
import { WeatherService } from "../services/WeatherService";
import { ok } from "../utils/api_response";
import { AppError } from "../utils/app_error";
import mongoose from "mongoose";

// Helper to fetch weather context safely
const getCachedWeather = async (user: any) => {
  if (!user || !user.latitude || !user.longitude) {
    return { temp: 25, condition: "Clear", humidity: 50 };
  }
  try {
    const weatherService = new WeatherService();
    return await weatherService.getCurrentWeather(user.latitude, user.longitude);
  } catch (err) {
    // Return mock fallback on OpenWeatherMap configuration issues
    return { temp: 25, condition: "Clear", humidity: 50 };
  }
};

// @desc    Get dynamic explore feed
// @route   GET /api/explore
// @access  Public (Optional Auth)
export const getExploreFeed = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    
    // Fetch active explore sections ordered
    const sections = await ExploreSection.find({ isActive: true }).sort({ order: 1 });
    
    const feed = [];

    for (const section of sections) {
      let items: any[] = [];

      switch (section.type) {
        case "banner":
          items = await ExplorePlacement.find({ section: "banner", isActive: true })
            .sort({ priority: -1 })
            .limit(5);
          break;

        case "featured":
          items = await ExplorePlacement.find({ section: "featured", isActive: true })
            .sort({ priority: -1 })
            .limit(6);
          break;

        case "trending":
          // Fetch trending content using calculated click counts in last 7 days
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          
          const trendingAgg = await ExploreClickEvent.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo }, actionType: "click" } },
            { $group: { _id: "$contentId", count: { $sum: 1 }, contentType: { $first: "$contentType" } } },
            { $sort: { count: -1 } },
            { $limit: 6 }
          ]);

          // Populate trending items from their respective collections
          for (const agg of trendingAgg) {
            if (agg.contentType === "article" && mongoose.isValidObjectId(agg._id)) {
              const article = await Article.findById(agg._id);
              if (article) {
                items.push({
                  id: article._id,
                  type: "article",
                  title: article.title,
                  description: article.body.slice(0, 150),
                  imageUrl: article.imageUrl || ""
                });
              }
            } else if (agg.contentType === "product" && mongoose.isValidObjectId(agg._id)) {
              const product = await StoreProduct.findById(agg._id);
              if (product) {
                items.push({
                  id: product._id,
                  type: "product",
                  title: product.name,
                  description: product.subtitle,
                  imageUrl: product.imageUrl || "",
                  price: product.price
                });
              }
            }
          }

          // Fallback: If no click logs, return first published articles
          if (items.length === 0) {
            const fallbackArticles = await Article.find({ isPublished: true }).limit(5);
            items = fallbackArticles.map(a => ({
              id: a._id,
              type: "article",
              title: a.title,
              description: a.body.slice(0, 150),
              imageUrl: a.imageUrl || ""
            }));
          }
          break;

        case "recommendations":
          if (user) {
            const weather = await getCachedWeather(user);
            const recommendationService = new AiRecommendationService();
            items = await recommendationService.generateRecommendations(user._id, weather);
          } else {
            // Unauthenticated: Fallback to featured placements
            const generalPlacements = await ExplorePlacement.find({ section: "featured", isActive: true }).limit(4);
            items = generalPlacements.map(p => ({
              id: p._id,
              contentType: p.contentType,
              contentId: p.contentId,
              title: p.title,
              description: p.description,
              imageUrl: p.imageUrl,
              reason: "Recommended based on general popularity."
            }));
          }
          break;

        case "products":
          const products = await StoreProduct.find().limit(6);
          items = products.map(p => ({
            id: p._id,
            type: "product",
            title: p.name,
            imageUrl: p.imageUrl || "",
            price: p.price,
            rating: p.rating
          }));
          break;

        case "experts":
          const experts = await User.find({ role: "expert" }).limit(4).select("name avatarUrl");
          const expertIds = experts.map(e => e._id);
          const profiles = await ExpertProfile.find({ userId: { $in: expertIds } });
          const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

          items = experts.map(e => {
            const p: any = profileMap.get(e._id.toString());
            return {
              id: e._id,
              type: "expert",
              title: e.name,
              imageUrl: e.avatarUrl || "",
              specialization: p?.specialization || "Generalist",
              experience: p?.yearsExperience || 0
            };
          });
          break;

        case "outbreaks":
          const spots = await OutbreakSpot.find().limit(5);
          items = spots.map(s => ({
            id: s._id,
            type: "outbreak",
            title: `${s.disease} in ${s.region}`,
            severity: s.severity,
            cases: s.cases
          }));
          break;
      }

      feed.push({
        id: section._id,
        titleEn: section.titleEn,
        titleAr: section.titleAr,
        type: section.type,
        items
      });
    }

    return ok(res, { feed });
  } catch (error) {
    next(error);
  }
};

// @desc    Get featured placements only
// @route   GET /api/explore/featured
// @access  Public
export const getFeaturedContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const placements = await ExplorePlacement.find({ section: "featured", isActive: true })
      .sort({ priority: -1 });
    return ok(res, { placements });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending content calculated dynamically
// @route   GET /api/explore/trending
// @access  Public
export const getTrendingContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trendingAgg = await ExploreClickEvent.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo }, actionType: "click" } },
      { $group: { _id: "$contentId", count: { $sum: 1 }, contentType: { $first: "$contentType" } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const result = [];
    for (const agg of trendingAgg) {
      if (agg.contentType === "article" && mongoose.isValidObjectId(agg._id)) {
        const article = await Article.findById(agg._id);
        if (article) {
          result.push({
            id: article._id,
            type: "article",
            title: article.title,
            imageUrl: article.imageUrl || ""
          });
        }
      } else if (agg.contentType === "product" && mongoose.isValidObjectId(agg._id)) {
        const product = await StoreProduct.findById(agg._id);
        if (product) {
          result.push({
            id: product._id,
            type: "product",
            title: product.name,
            imageUrl: product.imageUrl || "",
            price: product.price
          });
        }
      }
    }

    return ok(res, { trending: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get personalized AI recommendations
// @route   GET /api/explore/recommendations
// @access  Private
export const getRecommendations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;
    if (!user) {
      throw new AppError({ code: "AUTH_REQUIRED", statusCode: 401, message: "Authentication required" });
    }

    const weather = await getCachedWeather(user);
    const recommendationService = new AiRecommendationService();
    const recommendations = await recommendationService.generateRecommendations(user._id, weather);

    return ok(res, { recommendations });
  } catch (error) {
    next(error);
  }
};

// @desc    Track click/view explore analytics event
// @route   POST /api/explore/event
// @access  Public
export const recordExploreEvent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentType, contentId, actionType, section, abGroup } = req.body;
    const user = (req as any).user;

    if (!contentType || !contentId || !actionType || !section) {
      throw new AppError({ code: "VALIDATION_FAILED", statusCode: 400, message: "Required telemetry fields missing" });
    }

    const clickEvent = await ExploreClickEvent.create({
      user: user?._id,
      contentType,
      contentId,
      actionType,
      section,
      abGroup: abGroup || (user?._id && user._id.toString().charCodeAt(12) % 2 === 0 ? "A" : "B")
    });

    return ok(res, { message: "Analytics recorded successfully", eventId: clickEvent._id });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create Explore Placement
// @route   POST /api/explore/admin/content
// @access  Private/Admin
export const createExplorePlacement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { contentType, contentId, section, title, description, imageUrl, priority, targetInterests, startDate, endDate, abGroup } = req.body;

    if (!contentType || !contentId || !section || !title) {
      throw new AppError({ code: "VALIDATION_FAILED", statusCode: 400, message: "Required fields missing" });
    }

    const placement = await ExplorePlacement.create({
      contentType,
      contentId,
      section,
      title,
      description: description || "",
      imageUrl: imageUrl || "",
      priority: priority || 0,
      targetInterests: targetInterests || [],
      startDate,
      endDate,
      abGroup: abGroup || "all"
    });

    return ok(res, { message: "Placement created successfully", placement });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update Explore Placement
// @route   PUT /api/explore/admin/content/:id
// @access  Private/Admin
export const updateExplorePlacement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const placement = await ExplorePlacement.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!placement) {
      throw new AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Placement not found" });
    }
    return ok(res, { message: "Placement updated successfully", placement });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete Explore Placement
// @route   DELETE /api/explore/admin/content/:id
// @access  Private/Admin
export const deleteExplorePlacement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const placement = await ExplorePlacement.findByIdAndDelete(req.params.id);
    if (!placement) {
      throw new AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Placement not found" });
    }
    return ok(res, { message: "Placement deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: List Explore Placements
// @route   GET /api/explore/admin/content
// @access  Private/Admin
export const getAdminExplorePlacements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string;
    const section = req.query.section as string;
    const contentType = req.query.contentType as string;
    const isActive = req.query.isActive as string;

    const query: any = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } }
      ];
    }

    if (section) query.section = section;
    if (contentType) query.contentType = contentType;
    if (isActive !== undefined) query.isActive = isActive === 'true';

    const placements = await ExplorePlacement.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await ExplorePlacement.countDocuments(query);

    return ok(res, { 
      placements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Get Explore Sections
// @route   GET /api/explore/admin/sections
// @access  Private/Admin
export const getAdminExploreSections = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sections = await ExploreSection.find().sort({ order: 1 });
    return ok(res, { sections });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create Explore Section
// @route   POST /api/explore/admin/sections
// @access  Private/Admin
export const createExploreSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { titleEn, titleAr, type, order, isActive } = req.body;
    if (!titleEn || !type) {
      throw new AppError({ code: "VALIDATION_FAILED", statusCode: 400, message: "Required fields missing" });
    }
    const section = await ExploreSection.create({
      titleEn,
      titleAr: titleAr || titleEn,
      type,
      order: order || 0,
      isActive: isActive !== undefined ? isActive : true
    });
    return ok(res, { message: "Section created successfully", section });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Update Explore Section
// @route   PUT /api/explore/admin/sections/:id
// @access  Private/Admin
export const updateExploreSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const section = await ExploreSection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!section) {
      throw new AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Section not found" });
    }
    return ok(res, { message: "Section updated successfully", section });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Delete Explore Section
// @route   DELETE /api/explore/admin/sections/:id
// @access  Private/Admin
export const deleteExploreSection = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const section = await ExploreSection.findByIdAndDelete(req.params.id);
    if (!section) {
      throw new AppError({ code: "RESOURCE_NOT_FOUND", statusCode: 404, message: "Section not found" });
    }
    return ok(res, { message: "Section deleted successfully" });
  } catch (error) {
    next(error);
  }
};


// @desc    Admin: Get Discovery feed analytics
// @route   GET /api/explore/admin/stats
// @access  Private/Admin
export const getAdminExploreStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const totalViews = await ExploreClickEvent.countDocuments({ actionType: "view" });
    const totalClicks = await ExploreClickEvent.countDocuments({ actionType: "click" });
    const totalBookmarks = await ExploreClickEvent.countDocuments({ actionType: "bookmark" });
    const totalShares = await ExploreClickEvent.countDocuments({ actionType: "share" });

    const globalCtr = totalViews > 0 ? Math.round((totalClicks / totalViews) * 100) : 0;

    // CTR by A/B testing splits
    const viewsGroupA = await ExploreClickEvent.countDocuments({ abGroup: "A", actionType: "view" });
    const clicksGroupA = await ExploreClickEvent.countDocuments({ abGroup: "A", actionType: "click" });
    const ctrGroupA = viewsGroupA > 0 ? Math.round((clicksGroupA / viewsGroupA) * 100) : 0;

    const viewsGroupB = await ExploreClickEvent.countDocuments({ abGroup: "B", actionType: "view" });
    const clicksGroupB = await ExploreClickEvent.countDocuments({ abGroup: "B", actionType: "click" });
    const ctrGroupB = viewsGroupB > 0 ? Math.round((clicksGroupB / viewsGroupB) * 100) : 0;

    // CTR by section type
    const sectionCtrAgg = await ExploreClickEvent.aggregate([
      { $group: { _id: { section: "$section", action: "$actionType" }, count: { $sum: 1 } } }
    ]);

    const sectionStats: Record<string, { views: number, clicks: number, ctr: number }> = {};
    for (const agg of sectionCtrAgg) {
      const sectionName = agg._id.section;
      const action = agg._id.action;

      if (!sectionStats[sectionName]) {
        sectionStats[sectionName] = { views: 0, clicks: 0, ctr: 0 };
      }

      if (action === "view") sectionStats[sectionName].views = agg.count;
      if (action === "click") sectionStats[sectionName].clicks = agg.count;
    }

    for (const sectionName of Object.keys(sectionStats)) {
      const stats = sectionStats[sectionName];
      stats.ctr = stats.views > 0 ? Math.round((stats.clicks / stats.views) * 100) : 0;
    }

    return ok(res, {
      totalViews,
      totalClicks,
      totalBookmarks,
      totalShares,
      globalCtr,
      abGroupStats: {
        ctrGroupA,
        ctrGroupB,
        viewsGroupA,
        viewsGroupB
      },
      sectionStats
    });
  } catch (error) {
    next(error);
  }
};


