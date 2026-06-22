import { Request, Response } from "express";
import { ReportService } from "../services/report_service";
import { createReportSchema, getReportsQuerySchema, updateReportStatusSchema } from "../validators/report_validator";
import { CommunityAuditService } from "../services/community_audit_service";

export class ReportController {
  /**
   * POST /api/v1/community/reports
   * Creates a new report
   */
  static async createReport(req: Request, res: Response) {
    try {
      // Validate request body
      const validatedData = createReportSchema.parse({ body: req.body });
      
      const reporterId = (req as any).user?._id || (req as any).user?.id;
      if (!reporterId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }

      const report = await ReportService.createReport({
        ...validatedData.body,
        reporterId,
      });

      await CommunityAuditService.logAction(reporterId, 'REPORT_SUBMITTED', validatedData.body.entityModel, validatedData.body.reportedEntityId, { reason: validatedData.body.reason });

      return res.status(201).json({
        success: true,
        message: "Report submitted successfully",
        data: report,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, message: "Validation error", errors: error.errors });
      }
      if (error.message === "You have already reported this content.") {
        return res.status(409).json({ success: false, message: error.message });
      }
      return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
  }

  /**
   * GET /api/v1/admin/community/reports
   * Retrieves paginated reports
   */
  static async getReports(req: Request, res: Response) {
    try {
      const validatedQuery = getReportsQuerySchema.parse({ query: req.query });
      const { page, limit, status, reason } = validatedQuery.query;

      const result = await ReportService.getReportsPaginated(page, limit, { status, reason });

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
  }

  /**
   * PATCH /api/v1/admin/community/reports/:id/resolve
   */
  static async resolveReport(req: Request, res: Response) {
    try {
      const { params } = updateReportStatusSchema.parse({ params: req.params });
      const adminId = (req as any).user?._id || (req as any).user?.id;

      const report = await ReportService.resolveReport(params.id, adminId);
      if (!report) {
        return res.status(404).json({ success: false, message: "Report not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Report resolved successfully",
        data: report,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
  }

  /**
   * PATCH /api/v1/admin/community/reports/:id/dismiss
   */
  static async dismissReport(req: Request, res: Response) {
    try {
      const { params } = updateReportStatusSchema.parse({ params: req.params });
      const adminId = (req as any).user?._id || (req as any).user?.id;

      const report = await ReportService.dismissReport(params.id, adminId);
      if (!report) {
        return res.status(404).json({ success: false, message: "Report not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Report dismissed successfully",
        data: report,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
  }

  /**
   * PATCH /api/v1/admin/community/posts/:id/hide
   */
  static async hidePost(req: Request, res: Response) {
    try {
      // Reusing the schema since it just validates an ID in params
      const { params } = updateReportStatusSchema.parse({ params: req.params });
      const adminId = (req as any).user?._id || (req as any).user?.id;

      const post = await ReportService.hideReportedPost(params.id, adminId);
      if (!post) {
        return res.status(404).json({ success: false, message: "Post not found" });
      }

      return res.status(200).json({
        success: true,
        message: "Post hidden successfully",
        data: post,
      });
    } catch (error: any) {
      if (error.name === "ZodError") {
        return res.status(400).json({ success: false, message: "Validation error", errors: error.errors });
      }
      return res.status(500).json({ success: false, message: error.message || "Server Error" });
    }
  }
}
