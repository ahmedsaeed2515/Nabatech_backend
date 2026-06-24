"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cleanupOrphans = exports.bulkDeleteAssets = exports.deleteAsset = exports.detectOrphans = exports.getFolderAnalytics = exports.getAssets = exports.getCloudinaryStats = void 0;
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const diagnosis_history_model_1 = __importDefault(require("../models/diagnosis_history_model"));
const article_model_1 = require("../models/article_model");
const disease_model_1 = __importDefault(require("../models/disease_model"));
const expert_escalation_model_1 = __importDefault(require("../models/expert_escalation_model"));
const explore_placement_model_1 = __importDefault(require("../models/explore_placement_model"));
const home_banner_model_1 = __importDefault(require("../models/home_banner_model"));
const message_model_1 = __importDefault(require("../models/message_model"));
const my_plant_model_1 = __importDefault(require("../models/my_plant_model"));
const plant_identification_history_model_1 = __importDefault(require("../models/plant_identification_history_model"));
const plant_model_1 = __importDefault(require("../models/plant_model"));
const post_model_1 = __importDefault(require("../models/post_model"));
const store_product_model_1 = __importDefault(require("../models/store_product_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
const growth_measurement_model_1 = __importDefault(require("../models/growth_measurement_model"));
// Phase 1 - Cloudinary Analytics
const getCloudinaryStats = async (req, res) => {
    try {
        const usage = await cloudinary_1.default.api.usage();
        // Attempt to get resources count by type
        const imageCount = await cloudinary_1.default.api.resources({ resource_type: 'image', max_results: 1 });
        const videoCount = await cloudinary_1.default.api.resources({ resource_type: 'video', max_results: 1 });
        const rawCount = await cloudinary_1.default.api.resources({ resource_type: 'raw', max_results: 1 });
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getCloudinaryStats = getCloudinaryStats;
// Phase 2 & 6 - Media Explorer & Storage Analyzer
const getAssets = async (req, res) => {
    try {
        const { next_cursor, max_results = 100, direction = 'desc', sort_by = 'created_at', type = 'upload' } = req.query;
        // To support storage analyzer's "Largest Files", we might need to search instead of listing resources
        // Because resources() doesn't sort by size natively. But we'll just use resources() or search().
        let result;
        if (sort_by === 'bytes') {
            result = await cloudinary_1.default.search
                .expression(`resource_type:image OR resource_type:video OR resource_type:raw`)
                .sort_by('bytes', direction)
                .max_results(Number(max_results))
                .next_cursor(next_cursor || undefined)
                .execute();
        }
        else {
            result = await cloudinary_1.default.api.resources({
                max_results: Number(max_results),
                next_cursor: next_cursor ? String(next_cursor) : undefined,
                direction: direction,
                type: type
            });
        }
        res.status(200).json({
            success: true,
            data: {
                assets: result.resources,
                next_cursor: result.next_cursor
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getAssets = getAssets;
// Phase 3 - Folder Analytics
const getFolderAnalytics = async (req, res) => {
    try {
        // Top-level root folders
        const rootFolders = await cloudinary_1.default.api.root_folders();
        const folders = rootFolders.folders || [];
        // Specifically request known folders if they exist, or just use root folders
        const knownFolders = ['community_posts', 'diagnoses', 'assistant_images', 'avatars'];
        const targets = Array.from(new Set([...folders.map((f) => f.name), ...knownFolders]));
        const analytics = await Promise.all(targets.map(async (folderName) => {
            try {
                // Cloudinary doesn't have a direct "folder size" API in the free tier
                // We can approximate by searching the folder.
                const searchResult = await cloudinary_1.default.search
                    .expression(`folder:${folderName}`)
                    .max_results(500)
                    .execute();
                const totalSize = searchResult.resources.reduce((sum, r) => sum + r.bytes, 0);
                return {
                    folder: folderName,
                    assetCount: searchResult.total_count,
                    storageUsed: totalSize
                };
            }
            catch (e) {
                return { folder: folderName, assetCount: 0, storageUsed: 0 };
            }
        }));
        res.status(200).json({
            success: true,
            data: analytics.filter(a => a.assetCount > 0)
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getFolderAnalytics = getFolderAnalytics;
// Phase 4 - Orphan Detector
const detectOrphans = async (req, res) => {
    try {
        // 1. Fetch a batch of Cloudinary assets
        const { next_cursor, max_results = 200 } = req.query;
        const result = await cloudinary_1.default.api.resources({
            max_results: Number(max_results),
            next_cursor: next_cursor ? String(next_cursor) : undefined
        });
        const assets = result.resources;
        if (assets.length === 0) {
            return res.status(200).json({ success: true, data: { orphans: [], next_cursor: null } });
        }
        const cloudinaryIdsAndUrls = assets.flatMap((a) => [a.public_id, a.secure_url, a.url]);
        // 2. Query MongoDB to find if these exist
        const queries = [
            community_post_model_1.default.countDocuments({ $or: [{ imagePublicId: { $in: cloudinaryIdsAndUrls } }, { imageUrl: { $in: cloudinaryIdsAndUrls } }, { imageUrls: { $in: cloudinaryIdsAndUrls } }] }),
            diagnosis_history_model_1.default.countDocuments({ $or: [{ imagePublicId: { $in: cloudinaryIdsAndUrls } }, { imageUrl: { $in: cloudinaryIdsAndUrls } }] }),
            article_model_1.Article.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
            disease_model_1.default.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
            expert_escalation_model_1.default.countDocuments({ imagePath: { $in: cloudinaryIdsAndUrls } }),
            explore_placement_model_1.default.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
            home_banner_model_1.default.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
            message_model_1.default.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
            my_plant_model_1.default.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
            plant_identification_history_model_1.default.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
            plant_model_1.default.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
            post_model_1.default.countDocuments({ imageUrl: { $in: cloudinaryIdsAndUrls } }),
            store_product_model_1.default.countDocuments({ $or: [{ imageUrl: { $in: cloudinaryIdsAndUrls } }, { galleryImages: { $in: cloudinaryIdsAndUrls } }] }),
            user_model_1.default.countDocuments({ profileImage: { $in: cloudinaryIdsAndUrls } })
        ];
        // Actually we need to know exactly WHICH ones are orphans. A count doesn't tell us which asset is referenced.
        // So we fetch the actual matched identifiers.
        const findMatches = async (Model, fields) => {
            const orCondition = fields.map(f => ({ [f]: { $in: cloudinaryIdsAndUrls } }));
            const docs = await Model.find({ $or: orCondition }).select(fields.join(' ')).lean();
            let matchedStrings = [];
            docs.forEach((doc) => {
                fields.forEach(f => {
                    if (Array.isArray(doc[f])) {
                        matchedStrings.push(...doc[f]);
                    }
                    else if (doc[f]) {
                        matchedStrings.push(doc[f]);
                    }
                });
            });
            return matchedStrings;
        };
        const allMatchesArrays = await Promise.all([
            findMatches(community_post_model_1.default, ['imagePublicId', 'imageUrl', 'imageUrls', 'imagePath']),
            findMatches(diagnosis_history_model_1.default, ['imagePublicId', 'imageUrl']),
            findMatches(article_model_1.Article, ['imageUrl']),
            findMatches(disease_model_1.default, ['imageUrl']),
            findMatches(expert_escalation_model_1.default, ['imagePath']),
            findMatches(explore_placement_model_1.default, ['imageUrl']),
            findMatches(home_banner_model_1.default, ['imageUrl']),
            findMatches(message_model_1.default, ['imageUrl']),
            findMatches(my_plant_model_1.default, ['imageUrl']),
            findMatches(plant_identification_history_model_1.default, ['imageUrl']),
            findMatches(plant_model_1.default, ['imageUrl']),
            findMatches(post_model_1.default, ['imageUrl']),
            findMatches(store_product_model_1.default, ['imageUrl', 'galleryImages']),
            findMatches(user_model_1.default, ['avatarUrl']), // Fixed: was 'profileImage', actual field is 'avatarUrl'
            findMatches(growth_measurement_model_1.default, ['photoUrl']) // Added: was missing — GrowthMeasurement stores Cloudinary URLs
        ]);
        const allMatchedSet = new Set(allMatchesArrays.flat());
        const orphans = assets.filter((a) => {
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
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.detectOrphans = detectOrphans;
// Phase 5 & 8 - Delete Asset
const deleteAsset = async (req, res) => {
    try {
        const { public_id } = req.body;
        if (!public_id)
            return res.status(400).json({ success: false, error: "Missing public_id" });
        const result = await cloudinary_1.default.uploader.destroy(public_id);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.deleteAsset = deleteAsset;
// Phase 5 & 8 - Bulk Delete Assets
const bulkDeleteAssets = async (req, res) => {
    try {
        const { public_ids } = req.body;
        if (!Array.isArray(public_ids) || public_ids.length === 0) {
            return res.status(400).json({ success: false, error: "Missing or invalid public_ids array" });
        }
        const result = await cloudinary_1.default.api.delete_resources(public_ids);
        res.status(200).json({ success: true, data: result });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.bulkDeleteAssets = bulkDeleteAssets;
// Phase 8 - Cleanup Orphans
const cleanupOrphans = async (req, res) => {
    try {
        const { public_ids } = req.body;
        if (!Array.isArray(public_ids) || public_ids.length === 0) {
            return res.status(400).json({ success: false, error: "Missing or invalid public_ids array" });
        }
        // Identical to bulk delete, but explicitly called from Orphan detector
        const result = await cloudinary_1.default.api.delete_resources(public_ids);
        res.status(200).json({ success: true, data: result, message: `Successfully deleted ${public_ids.length} orphans.` });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.cleanupOrphans = cleanupOrphans;
