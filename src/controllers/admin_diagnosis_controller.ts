import { Request, Response } from "express";
import DiagnosisHistory from "../models/diagnosis_history_model";

// @desc    Get paginated diagnosis list for admins
// @route   GET /api/admin/diagnoses
// @access  Private/Admin
export const getAdminDiagnoses = async (req: Request, res: Response) => {
  try {
    const { page, limit, from, to, severity, feedbackStatus } = req.query as any;

    const pageNum = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 20;
    const skip = (pageNum - 1) * pageSize;

    const query: any = {};
    if (severity) query.severity = severity;
    if (feedbackStatus) query.feedbackStatus = feedbackStatus;
    if (from || to) {
      query.diagnosedAt = {};
      if (from) query.diagnosedAt.$gte = new Date(from);
      if (to) query.diagnosedAt.$lte = new Date(to);
    }

    const items = await DiagnosisHistory.find(query)
      .sort({ diagnosedAt: -1, _id: -1 })
      .skip(skip)
      .limit(pageSize);

    const total = await DiagnosisHistory.countDocuments(query);
    const totalPages = Math.ceil(total / pageSize);

    res.status(200).json({
      success: true,
      data: {
        items,
        total,
        page: pageNum,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch admin diagnoses", error });
  }
};

// @desc    Get diagnosis analytics
// @route   GET /api/admin/diagnoses/analytics
// @access  Private/Admin
export const getAdminDiagnosisAnalytics = async (req: Request, res: Response) => {
  try {
    const { from, to, timeZone } = req.query as any;

    const query: any = {};
    if (from || to) {
      query.diagnosedAt = {};
      if (from) query.diagnosedAt.$gte = new Date(from);
      if (to) query.diagnosedAt.$lte = new Date(to);
    }

    const tz = timeZone || "UTC";

    const totalDiagnoses = await DiagnosisHistory.countDocuments(query);
    
    const bySeverity = await DiagnosisHistory.aggregate([
      { $match: query },
      { $group: { _id: "$severity", count: { $sum: 1 } } }
    ]);

    const topDiseases = await DiagnosisHistory.aggregate([
      { $match: query },
      { $group: { _id: "$diseaseNameEn", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const byDay = await DiagnosisHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$diagnosedAt", timezone: tz } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const totalOfflineScans = await DiagnosisHistory.countDocuments({ ...query, isOffline: true });
    const totalRemoteScans = await DiagnosisHistory.countDocuments({ ...query, isOffline: false });

    res.status(200).json({
      success: true,
      data: {
        totals: totalDiagnoses,
        byDay: byDay.map(d => ({ date: d._id, count: d.count })),
        bySeverity: bySeverity.map(s => ({ severity: s._id, count: s.count })),
        topDiseases: topDiseases.map(d => ({ name: d._id || "Healthy", count: d.count })),
        offlineVsRemote: {
          offline: totalOfflineScans,
          remote: totalRemoteScans
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch analytics", error });
  }
};
