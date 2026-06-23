import { Request, Response } from "express";
import cloudinary from "../config/cloudinary";
import CommunityPost from "../models/community_post_model";
import DiagnosisHistory from "../models/diagnosis_history_model";
import { Article } from "../models/article_model";
import Disease from "../models/disease_model";
import ExpertEscalation from "../models/expert_escalation_model";
import ExplorePlacement from "../models/explore_placement_model";
import HomeBanner from "../models/home_banner_model";
import Message from "../models/message_model";
import MyPlant from "../models/my_plant_model";
import PlantIdentificationHistory from "../models/plant_identification_history_model";
import Plant from "../models/plant_model";
import Post from "../models/post_model";
import StoreProduct from "../models/store_product_model";
import User from "../models/user_model";
import GrowthMeasurement from "../models/growth_measurement_model";

// Phase 1 - Cloudinary Analytics
export const getCloudinaryStats = async (req: Request, res: Response) => {
  try {
    const usage = await cloudinary.api.usage();
    
    // Attempt to get resources count by type
    const imageCount = await cloudinary.api.resources({ resource_type: 'image', max_results: 1 });
    const videoCount = await cloudinary.api.resources({ resource_type: 'video', max_results: 1 });
    const rawCount = await cloudinary.api.resources({ resource_type: 'raw', max_results: 1 });

    res.status(200).json({
      success: true,
      data: {
        totalStorageUsed: usage.storage?.usage || 0,
        totalStorageLimit: usage.storage?.limit || 0,
        totalBandwidth: usage.bandwidth?.usage || 0,
        bandwidthLimit: usage.bandwidth?.limit || 0,
        totalAssets: usage.resources || 0,
        imagesCount: imageCount?.total_count || 0,
        videosCount: videoCount?.total_count || 0,
        documentsCount: rawCount?.total_count || 0,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Phase 2 & 6 - Media Explorer & Storage Analyzer
export const getAssets = async (req: Request, res: Response) => {
  try {
    const { next_cursor, max_results = 100, direction = 'desc', sort_by = 'created_at', type = 'upload' } = req.query;
    
    // To support storage analyzer's "Largest Files", we might need to search instead of listing resources
    // Because resources() doesn't sort by size natively. But we'll just use resources() or search().
    
    let result;
    if (sort_by === 'bytes') {
      result = await cloudinary.search
        .expression(`resource_type:image OR resource_type:video OR resource_type:raw`)
        .sort_by('bytes', direction as 'asc' | 'desc')
        .max_results(Number(max_results))
        .next_cursor(next_cursor as string || undefined)
        .execute();
    } else {
      result = await cloudinary.api.resources({
        max_results: Number(max_results),
        next_cursor: next_cursor ? String(next_cursor) : undefined,
        direction: direction as string,
        type: type as string
      });
    }

    res.status(200).json({
      success: true,
      data: {
        assets: result.resources,
        next_cursor: result.next_cursor
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Phase 3 - Folder Analytics
export const getFolderAnalytics = async (req: Request, res: Response) => {
  try {
    // Top-level root folders
    const rootFolders = await cloudinary.api.root_folders();
    const folders = rootFolders.folders || [];
    
    // Specifically request known folders if they exist, or just use root folders
    const knownFolders = ['community_posts', 'diagnoses', 'assistant_images', 'avatars'];
    const targets = Array.from(new Set([...folders.map((f: any) => f.name), ...knownFolders]));

    const analytics = await Promise.all(
      targets.map(async (folderName: string) => {
        try {
          // Cloudinary doesn't have a direct "folder size" API in the free tier
          // We can approximate by searching the folder.
          const searchResult = await cloudinary.search
            .expression(`folder:${folderName}`)
            .max_results(500)
            .execute();
            
          const totalSize = searchResult.resources.reduce((sum: number, r: any) => sum + r.bytes, 0);
          
          return {
            folder: folderName,
            assetCount: searchResult.total_count,
            storageUsed: totalSize
          };
        } catch (e) {
          return { folder: folderName, assetCount: 0, storageUsed: 0 };
        }
      })
    );

    res.status(200).json({
      success: true,
      data: analytics.filter(a => a.assetCount > 0)
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Phase 4 - Orphan Detector
export const detectOrphans = async (req: Request, res: Response) => {
  try {
    // 1. Fetch a batch of Cloudinary assets
    const { next_cursor, max_results = 200 } = req.query;
    const result = await cloudinary.api.resources({
      max_results: Number(max_results),
      next_cursor: next_cursor ? String(next_cursor) : undefined
    });

    const assets = result.resources;
    if (assets.length === 0) {
      return res.status(200).json({ success: true, data: { orphans: [], next_cursor: null } });
    }

    const cloudinaryIdsAndUrls = assets.flatMap((a: any) => [a.public_id, a.secure_url, a.url]);

    // 2. Query MongoDB to find if these exist
    const queries = [
      CommunityPost.countDocuments({ $or: [{ imagePublicId: { $in: cloudinaryIdsAndUrls } }, { imageUrl: { $in: cloudinaryIdsAndUrls } }, { imageUrls: { $in: cloudinaryIdsAndUrls } }] }),
      DiagnosisHistory.countDocuments({ $or: [{ imagePublicId: { $in: cloudinaryIdsAndUrls } }, { imageUrl: { $in: cloudinaryIdsAndUrls } }] }),
      Article.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
      Disease.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
      ExpertEscalation.countDocuments({ imagePath: { $in: cloudinaryIdsAndUrls } }),
      ExplorePlacement.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
      HomeBanner.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
      Message.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
      MyPlant.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
      PlantIdentificationHistory.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
      Plant.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
      Post.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
      StoreProduct.countDocuments({ $or: [{ imageUrl: { $in: cloudinaryIdsAndUrls } }, { galleryImages: { $in: cloudinaryIdsAndUrls } }] }),
      User.countDocuments({ profileImage: { $in: cloudinaryIdsAndUrls } })
    ];

    // Actually we need to know exactly WHICH ones are orphans. A count doesn't tell us which asset is referenced.
    // So we fetch the actual matched identifiers.
    
    const findMatches = async (Model: any, fields: string[]) => {
      const orCondition = fields.map(f => ({ [f]: { $in: cloudinaryIdsAndUrls } }));
      const docs = await Model.find({ $or: orCondition }).select(fields.join(' ')).lean();
      
      let matchedStrings: string[] = [];
      docs.forEach((doc: any) => {
        fields.forEach(f => {
          if (Array.isArray(doc[f])) {
            matchedStrings.push(...doc[f]);
          } else if (doc[f]) {
            matchedStrings.push(doc[f]);
          }
        });
      });
      return matchedStrings;
    };

    const allMatchesArrays = await Promise.all([
      findMatches(CommunityPost, ['imagePublicId', 'imageUrl', 'imageUrls', 'imagePath']),
      findMatches(DiagnosisHistory, ['imagePublicId', 'imageUrl']),
      findMatches(Article, ['imageUrl']),
      findMatches(Disease, ['imageUrl']),
      findMatches(ExpertEscalation, ['imagePath']),
      findMatches(ExplorePlacement, ['imageUrl']),
      findMatches(HomeBanner, ['imageUrl']),
      findMatches(Message, ['imageUrl']),
      findMatches(MyPlant, ['imageUrl']),
      findMatches(PlantIdentificationHistory, ['imageUrl']),
      findMatches(Plant, ['imageUrl']),
      findMatches(Post, ['imageUrl']),
      findMatches(StoreProduct, ['imageUrl', 'galleryImages']),
      findMatches(User, ['avatarUrl']),            // Fixed: was 'profileImage', actual field is 'avatarUrl'
      findMatches(GrowthMeasurement, ['photoUrl']) // Added: was missing — GrowthMeasurement stores Cloudinary URLs
    ]);

    const allMatchedSet = new Set(allMatchesArrays.flat());

    const orphans = assets.filter((a: any) => {
      // If none of its identifiers (public_id, secure_url, url) are in the DB set, it's an orphan
      return !allMatchedSet.has(a.public_id) && !allMatchedSet.has(a.secure_url) && !allMatchedSet.has(a.url);
    });

    res.status(200).json({
      success: true,
      data: {
        orphans,
        next_cursor: result.next_cursor,
        totalChecked: assets.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Phase 5 & 8 - Delete Asset
export const deleteAsset = async (req: Request, res: Response) => {
  try {
    const { public_id } = req.body;
    if (!public_id) return res.status(400).json({ success: false, error: "Missing public_id" });

    const result = await cloudinary.uploader.destroy(public_id);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Phase 5 & 8 - Bulk Delete Assets
export const bulkDeleteAssets = async (req: Request, res: Response) => {
  try {
    const { public_ids } = req.body;
    if (!Array.isArray(public_ids) || public_ids.length === 0) {
      return res.status(400).json({ success: false, error: "Missing or invalid public_ids array" });
    }

    const result = await cloudinary.api.delete_resources(public_ids);
    res.status(200).json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Phase 8 - Cleanup Orphans
export const cleanupOrphans = async (req: Request, res: Response) => {
  try {
    const { public_ids } = req.body;
    if (!Array.isArray(public_ids) || public_ids.length === 0) {
      return res.status(400).json({ success: false, error: "Missing or invalid public_ids array" });
    }

    // Identical to bulk delete, but explicitly called from Orphan detector
    const result = await cloudinary.api.delete_resources(public_ids);
    res.status(200).json({ success: true, data: result, message: `Successfully deleted ${public_ids.length} orphans.` });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
