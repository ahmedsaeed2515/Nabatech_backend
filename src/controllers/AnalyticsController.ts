import { Request, Response } from 'express';
import { AnalyticsService } from '../services/AnalyticsService';
import { AnalyticsSnapshotRepository } from '../repositories/AnalyticsSnapshotRepository';
import { AiReportRepository } from '../repositories/AiReportRepository';

export class AnalyticsController {
  private analyticsService: AnalyticsService;
  private snapshotRepo: AnalyticsSnapshotRepository;
  private reportRepo: AiReportRepository;

  constructor() {
    this.analyticsService = new AnalyticsService();
    this.snapshotRepo = new AnalyticsSnapshotRepository();
    this.reportRepo = new AiReportRepository();
  }

  generateSnapshot = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const snapshot = await this.analyticsService.generateWeeklySnapshot(userId);
      res.status(201).json({ status: 'success', data: snapshot });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  getSnapshots = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const snapshots = await this.snapshotRepo.findByUserId(userId);
      res.status(200).json({ status: 'success', data: snapshots });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  triggerAiReport = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const result = await this.analyticsService.triggerAiAnalysis(userId);
      res.status(202).json({ status: 'success', data: result });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };

  getAiReports = async (req: Request, res: Response) => {
    try {
      const userId = (req as any).user._id || (req as any).user.userId;
      const reports = await this.reportRepo.findByUserId(userId);
      res.status(200).json({ status: 'success', data: reports });
    } catch (err: any) {
      res.status(400).json({ status: 'error', message: err.message });
    }
  };
}


