"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.purgeCollection = exports.dropCollection = exports.cleanupDatabase = exports.getStorageAnalyzer = exports.getCollectionDetails = exports.getCollections = exports.getDatabaseStats = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
// ==========================================
// Phase 1 - DB Analytics
// ==========================================
const getDatabaseStats = async (req, res) => {
    try {
        const db = mongoose_1.default.connection.db;
        if (!db) {
            return res.status(500).json({ success: false, error: "Database not connected" });
        }
        const stats = await db.stats();
        const collections = await db.listCollections().toArray();
        // Attempt to gather sizes per collection for Largest Collections breakdown
        const collectionStats = await Promise.all(collections.map(async (c) => {
            try {
                const collStats = await db.command({ collStats: c.name });
                return {
                    name: c.name,
                    size: collStats.size || 0,
                    count: collStats.count || 0
                };
            }
            catch (e) {
                return { name: c.name, size: 0, count: 0 };
            }
        }));
        const largestCollections = collectionStats
            .sort((a, b) => b.size - a.size)
            .slice(0, 5);
        res.status(200).json({
            success: true,
            data: {
                totalDatabaseSize: stats.dataSize || 0,
                totalStorageSize: stats.storageSize || 0,
                totalCollections: stats.collections || 0,
                totalDocuments: stats.objects || 0,
                indexesCount: stats.indexes || 0,
                indexSize: stats.indexSize || 0,
                largestCollections
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getDatabaseStats = getDatabaseStats;
// ==========================================
// Phase 2 - Collection Explorer
// ==========================================
const getCollections = async (req, res) => {
    try {
        const db = mongoose_1.default.connection.db;
        if (!db)
            return res.status(500).json({ success: false, error: "Database not connected" });
        const collections = await db.listCollections().toArray();
        const collectionDetails = await Promise.all(collections.map(async (c) => {
            try {
                const collStats = await db.command({ collStats: c.name });
                return {
                    name: c.name,
                    count: collStats.count || 0,
                    size: collStats.size || 0,
                    indexes: collStats.nindexes || 0,
                };
            }
            catch (e) {
                // Fallback if collStats fails
                const count = await db.collection(c.name).estimatedDocumentCount();
                return { name: c.name, count, size: 0, indexes: 0 };
            }
        }));
        res.status(200).json({
            success: true,
            data: collectionDetails
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getCollections = getCollections;
// ==========================================
// Phase 3 - Collection Details
// ==========================================
const getCollectionDetails = async (req, res) => {
    try {
        const db = mongoose_1.default.connection.db;
        if (!db)
            return res.status(500).json({ success: false, error: "Database not connected" });
        const collectionName = req.params.name;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const collection = db.collection(collectionName);
        // Using aggregation for safer stats on newer Mongo versions
        let stats = {};
        try {
            stats = await db.command({ collStats: collectionName });
        }
        catch (e) { }
        const totalDocuments = await collection.estimatedDocumentCount();
        const documents = await collection.find().sort({ _id: -1 }).skip(skip).limit(limit).toArray();
        const indexes = await collection.indexes();
        res.status(200).json({
            success: true,
            data: {
                name: collectionName,
                totalDocuments,
                size: stats.size || 0,
                indexesCount: indexes.length,
                indexes,
                documents,
                page,
                totalPages: Math.ceil(totalDocuments / limit)
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getCollectionDetails = getCollectionDetails;
// ==========================================
// Phase 4 - Storage Analyzer
// ==========================================
const getStorageAnalyzer = async (req, res) => {
    try {
        const db = mongoose_1.default.connection.db;
        if (!db)
            return res.status(500).json({ success: false, error: "Database not connected" });
        const collections = await db.listCollections().toArray();
        const collectionStats = await Promise.all(collections.map(async (c) => {
            try {
                const collStats = await db.command({ collStats: c.name });
                return {
                    name: c.name,
                    size: collStats.size || 0,
                    storageSize: collStats.storageSize || 0,
                    count: collStats.count || 0
                };
            }
            catch (e) {
                return { name: c.name, size: 0, storageSize: 0, count: 0 };
            }
        }));
        const largestCollections = [...collectionStats]
            .sort((a, b) => b.size - a.size)
            .slice(0, 10);
        res.status(200).json({
            success: true,
            data: {
                largestCollections,
                storageBreakdown: collectionStats
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.getStorageAnalyzer = getStorageAnalyzer;
// ==========================================
// Phase 5 - Cleanup Center
// ==========================================
const cleanupDatabase = async (req, res) => {
    try {
        const db = mongoose_1.default.connection.db;
        if (!db)
            return res.status(500).json({ success: false, error: "Database not connected" });
        const { type } = req.body;
        let deletedCount = 0;
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        switch (type) {
            case 'old_notifications':
                const notificationsCol = db.collection('notifications');
                const notifResult = await notificationsCol.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
                deletedCount = notifResult.deletedCount;
                break;
            case 'old_logs':
                const logsCol = db.collection('chatlogs');
                const logsResult = await logsCol.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
                deletedCount = logsResult.deletedCount;
                break;
            case 'old_diagnosis':
                const diagCol = db.collection('diagnoses');
                const diagResult = await diagCol.deleteMany({ createdAt: { $lt: thirtyDaysAgo } });
                deletedCount = diagResult.deletedCount;
                break;
            case 'soft_deleted_users':
                const usersCol = db.collection('users');
                // User schema uses isDeleted: Boolean (not status: 'deleted')
                const usersResult = await usersCol.deleteMany({ isDeleted: true });
                deletedCount = usersResult.deletedCount;
                break;
            case 'orphan_records':
                // Not straightforward to do generically, we will stub it and delete 0 for now
                deletedCount = 0;
                break;
            default:
                return res.status(400).json({ success: false, error: "Invalid cleanup type" });
        }
        res.status(200).json({
            success: true,
            data: {
                type,
                deletedCount,
                message: `Successfully cleaned up ${deletedCount} records.`
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.cleanupDatabase = cleanupDatabase;
// ==========================================
// Phase 6 - Super Admin Operations
// ==========================================
const dropCollection = async (req, res) => {
    try {
        const db = mongoose_1.default.connection.db;
        if (!db)
            return res.status(500).json({ success: false, error: "Database not connected" });
        const collectionName = req.params.name;
        // VERY DANGEROUS - SUPER_ADMIN ONLY expected
        await db.dropCollection(collectionName);
        res.status(200).json({
            success: true,
            message: `Collection ${collectionName} dropped successfully.`
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.dropCollection = dropCollection;
const purgeCollection = async (req, res) => {
    try {
        const db = mongoose_1.default.connection.db;
        if (!db)
            return res.status(500).json({ success: false, error: "Database not connected" });
        const collectionName = req.params.name;
        // VERY DANGEROUS - SUPER_ADMIN ONLY expected
        const collection = db.collection(collectionName);
        const result = await collection.deleteMany({});
        res.status(200).json({
            success: true,
            message: `Purged ${result.deletedCount} documents from ${collectionName}.`
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
exports.purgeCollection = purgeCollection;
