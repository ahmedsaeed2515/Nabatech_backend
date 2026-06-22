"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const report_service_1 = require("../services/report_service");
const report_validator_1 = require("../validators/report_validator");
const community_audit_service_1 = require("../services/community_audit_service");
class ReportController {
    /**
     * POST /api/v1/community/reports
     * Creates a new report
     */
    static async createReport(req, res) {
        try {
            // Validate request body
            const validatedData = report_validator_1.createReportSchema.parse({ body: req.body });
            const reporterId = req.user?._id || req.user?.id;
            if (!reporterId) {
                return res.status(401).json({ success: false, message: "Unauthorized" });
            }
            const report = await report_service_1.ReportService.createReport({
                ...validatedData.body,
                reporterId,
            });
            await community_audit_service_1.CommunityAuditService.logAction(reporterId, 'REPORT_SUBMITTED', validatedData.body.entityModel, validatedData.body.reportedEntityId, { reason: validatedData.body.reason });
            return res.status(201).json({
                success: true,
                message: "Report submitted successfully",
                data: report,
            });
        }
        catch (error) {
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
    static async getReports(req, res) {
        try {
            const validatedQuery = report_validator_1.getReportsQuerySchema.parse({ query: req.query });
            const { page, limit, status, reason } = validatedQuery.query;
            const result = await report_service_1.ReportService.getReportsPaginated(page, limit, { status, reason });
            return res.status(200).json({
                success: true,
                data: result,
            });
        }
        catch (error) {
            if (error.name === "ZodError") {
                return res.status(400).json({ success: false, message: "Validation error", errors: error.errors });
            }
            return res.status(500).json({ success: false, message: error.message || "Server Error" });
        }
    }
    /**
     * PATCH /api/v1/admin/community/reports/:id/resolve
     */
    static async resolveReport(req, res) {
        try {
            const { params } = report_validator_1.updateReportStatusSchema.parse({ params: req.params });
            const adminId = req.user?._id || req.user?.id;
            const report = await report_service_1.ReportService.resolveReport(params.id, adminId);
            if (!report) {
                return res.status(404).json({ success: false, message: "Report not found" });
            }
            return res.status(200).json({
                success: true,
                message: "Report resolved successfully",
                data: report,
            });
        }
        catch (error) {
            if (error.name === "ZodError") {
                return res.status(400).json({ success: false, message: "Validation error", errors: error.errors });
            }
            return res.status(500).json({ success: false, message: error.message || "Server Error" });
        }
    }
    /**
     * PATCH /api/v1/admin/community/reports/:id/dismiss
     */
    static async dismissReport(req, res) {
        try {
            const { params } = report_validator_1.updateReportStatusSchema.parse({ params: req.params });
            const adminId = req.user?._id || req.user?.id;
            const report = await report_service_1.ReportService.dismissReport(params.id, adminId);
            if (!report) {
                return res.status(404).json({ success: false, message: "Report not found" });
            }
            return res.status(200).json({
                success: true,
                message: "Report dismissed successfully",
                data: report,
            });
        }
        catch (error) {
            if (error.name === "ZodError") {
                return res.status(400).json({ success: false, message: "Validation error", errors: error.errors });
            }
            return res.status(500).json({ success: false, message: error.message || "Server Error" });
        }
    }
    /**
     * PATCH /api/v1/admin/community/posts/:id/hide
     */
    static async hidePost(req, res) {
        try {
            // Reusing the schema since it just validates an ID in params
            const { params } = report_validator_1.updateReportStatusSchema.parse({ params: req.params });
            const adminId = req.user?._id || req.user?.id;
            const post = await report_service_1.ReportService.hideReportedPost(params.id, adminId);
            if (!post) {
                return res.status(404).json({ success: false, message: "Post not found" });
            }
            return res.status(200).json({
                success: true,
                message: "Post hidden successfully",
                data: post,
            });
        }
        catch (error) {
            if (error.name === "ZodError") {
                return res.status(400).json({ success: false, message: "Validation error", errors: error.errors });
            }
            return res.status(500).json({ success: false, message: error.message || "Server Error" });
        }
    }
}
exports.ReportController = ReportController;
