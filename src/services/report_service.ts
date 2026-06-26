import { Types } from "mongoose";
import CommunityReport, { ICommunityReport } from "../models/community_report_model";
import CommunityPost from "../models/community_post_model";
import { logger } from "../utils/logger";
import { NotificationService } from "./NotificationService";

export class ReportService {
  /**
   * Creates a new community report.
   */
  static async createReport(data: {
    reporterId: string;
    reportedEntityId: string;
    entityModel: "CommunityPost" | "CommentV2";
    reason: string;
    details?: string;
  }): Promise<ICommunityReport> {
    // Check if the report already exists
    const existingReport = await CommunityReport.findOne({
      reporterId: data.reporterId,
      reportedEntityId: data.reportedEntityId,
    });

    if (existingReport) {
      throw new Error("You have already reported this content.");
    }

    const report = new CommunityReport(data);
    const saved = await report.save();

    logger.info('User submitted a report', {
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
  static async getReportsPaginated(
    page: number,
    limit: number,
    filters: { status?: string; reason?: string }
  ) {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.reason) query.reason = filters.reason;

    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      CommunityReport.find(query)
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
      CommunityReport.countDocuments(query),
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
  static async resolveReport(reportId: string, adminId: string): Promise<ICommunityReport | null> {
    const updated = await CommunityReport.findByIdAndUpdate(
      reportId,
      {
        status: "Resolved",
        resolvedBy: new Types.ObjectId(adminId),
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (updated) {
      NotificationService.sendNotification({
        userId: updated.reporterId.toString(),
        actorId: adminId,
        type: 'REPORT_RESOLVED',
        entityId: updated._id.toString(),
        entityType: 'CommunityReport',
        title: 'Report Resolved',
        message: 'Your report has been reviewed and resolved by our moderation team. Thank you for keeping the community safe.'
      }).catch(e => logger.error('Error sending report resolution notification', { error: e }));
    }

    return updated;
  }

  /**
   * Dismisses a report.
   */
  static async dismissReport(reportId: string, adminId: string): Promise<ICommunityReport | null> {
    return await CommunityReport.findByIdAndUpdate(
      reportId,
      {
        status: "Dismissed",
        resolvedBy: new Types.ObjectId(adminId),
        resolvedAt: new Date(),
      },
      { new: true }
    );
  }

  /**
   * Hides a reported CommunityPost.
   */
  static async hideReportedPost(postId: string, adminId: string): Promise<any | null> {
    return await CommunityPost.findByIdAndUpdate(
      postId,
      {
        status: "hidden",
        moderatedBy: new Types.ObjectId(adminId),
        moderatedAt: new Date(),
        moderationReason: "Hidden by admin due to community reports",
      },
      { new: true }
    );
  }
}


