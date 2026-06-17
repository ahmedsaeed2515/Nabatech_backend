"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const AnalyticsService_1 = require("../services/AnalyticsService");
const AnalyticsSnapshotRepository_1 = require("../repositories/AnalyticsSnapshotRepository");
const AiReportRepository_1 = require("../repositories/AiReportRepository");
class AnalyticsController {
    constructor() {
        this.generateSnapshot = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const snapshot = await this.analyticsService.generateWeeklySnapshot(userId);
                res.status(201).json({ status: 'success', data: snapshot });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.getSnapshots = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const snapshots = await this.snapshotRepo.findByUserId(userId);
                res.status(200).json({ status: 'success', data: snapshots });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.triggerAiReport = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const result = await this.analyticsService.triggerAiAnalysis(userId);
                res.status(202).json({ status: 'success', data: result });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.getAiReports = async (req, res) => {
            try {
                const userId = req.user._id || req.user.userId;
                const reports = await this.reportRepo.findByUserId(userId);
                res.status(200).json({ status: 'success', data: reports });
            }
            catch (err) {
                res.status(400).json({ status: 'error', message: err.message });
            }
        };
        this.analyticsService = new AnalyticsService_1.AnalyticsService();
        this.snapshotRepo = new AnalyticsSnapshotRepository_1.AnalyticsSnapshotRepository();
        this.reportRepo = new AiReportRepository_1.AiReportRepository();
    }
}
exports.AnalyticsController = AnalyticsController;
