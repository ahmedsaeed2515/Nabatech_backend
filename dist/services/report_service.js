"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportService = void 0;
const mongoose_1 = require("mongoose");
const community_report_model_1 = __importDefault(require("../models/community_report_model"));
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const logger_1 = require("../utils/logger");
const notification_service_1 = require("./notification_service");
class ReportService {
    /**
     * Creates a new community report.
     */
    static async createReport(data) {
        // Check if the report already exists
        const existingReport = await community_report_model_1.default.findOne({
            reporterId: data.reporterId,
            reportedEntityId: data.reportedEntityId,
        });
        if (existingReport) {
            throw new Error("You have already reported this content.");
        }
        const report = new community_report_model_1.default(data);
        const saved = await report.save();
        logger_1.logger.info('User submitted a report', {
            event: 'community_feed_and_moderation.submit_report',
            actorId: data.reporterId,
            targetId: data.reportedEntityId,
            payload: { reason: data.reason }
        });
        return saved;
    }
    /**
     * Retrieves reports with pagination and filtering.
     */
    static async getReportsPaginated(page, limit, filters) {
        const query = {};
        if (filters.status)
            query.status = filters.status;
        if (filters.reason)
            query.reason = filters.reason;
        const skip = (page - 1) * limit;
        const [reports, total] = await Promise.all([
            community_report_model_1.default.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("reporterId", "name email profilePicture")
                .populate("resolvedBy", "name email")
                // We might want to selectively populate the reported entity, but Mongoose dynamic population can be tricky.
                // We'll populate just the CommunityPost for now if the model is CommunityPost
                .populate({
                path: "reportedEntityId",
                select: "title content authorName imagePath status",
                // Strictly speaking, Mongoose needs `refPath` for dynamic population to work smoothly across multiple models,
                // but since `CommunityReport` doesn't have `refPath`, we might just get nulls for Comments if we don't handle it.
                // In a real app we'd configure `refPath` in the schema or populate manually.
                // For now, let's keep it simple.
            })
                .exec(),
            community_report_model_1.default.countDocuments(query),
        ]);
        return {
            reports,
            total,
            page,
            pages: Math.ceil(total / limit),
        };
    }
    /**
     * Resolves a report.
     */
    static async resolveReport(reportId, adminId) {
        const updated = await community_report_model_1.default.findByIdAndUpdate(reportId, {
            status: "Resolved",
            resolvedBy: new mongoose_1.Types.ObjectId(adminId),
            resolvedAt: new Date(),
        }, { new: true });
        if (updated) {
            notification_service_1.NotificationService.sendNotification({
                userId: updated.reporterId.toString(),
                actorId: adminId,
                type: 'REPORT_RESOLVED',
                entityId: updated._id.toString(),
                entityType: 'CommunityReport',
                title: 'Report Resolved',
                message: 'Your report has been reviewed and resolved by our moderation team. Thank you for keeping the community safe.'
            }).catch(e => logger_1.logger.error('Error sending report resolution notification', { error: e }));
        }
        return updated;
    }
    /**
     * Dismisses a report.
     */
    static async dismissReport(reportId, adminId) {
        return await community_report_model_1.default.findByIdAndUpdate(reportId, {
            status: "Dismissed",
            resolvedBy: new mongoose_1.Types.ObjectId(adminId),
            resolvedAt: new Date(),
        }, { new: true });
    }
    /**
     * Hides a reported CommunityPost.
     */
    static async hideReportedPost(postId, adminId) {
        return await community_post_model_1.default.findByIdAndUpdate(postId, {
            status: "hidden",
            moderatedBy: new mongoose_1.Types.ObjectId(adminId),
            moderatedAt: new Date(),
            moderationReason: "Hidden by admin due to community reports",
        }, { new: true });
    }
}
exports.ReportService = ReportService;
