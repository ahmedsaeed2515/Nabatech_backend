import { Request, Response } from "express";
import DiagnosisHistory from "../models/diagnosis_history_model";

// @desc    Get user diagnosis logs
// @route   GET /api/history
// @access  Private
export const getHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const history = await DiagnosisHistory.find({ user: userId }).sort({ diagnosedAt: -1 });

    res.status(200).json({
      success: true,
      count: history.length,
      history: history.map(h => ({
        id: h._id,
        imageUrl: h.imageUrl,
        diseaseNameAr: h.diseaseNameAr,
        diseaseNameEn: h.diseaseNameEn,
        confidence: h.confidence,
        severity: h.severity,
        diagnosedAt: h.diagnosedAt,
        isOffline: h.isOffline,
        feedbackStatus: h.feedbackStatus,
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch diagnosis logs", error });
  }
};

// @desc    Delete a specific diagnosis log
// @route   DELETE /api/history/:id
// @access  Private
export const deleteDiagnosis = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const log = await DiagnosisHistory.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!log) {
      return res.status(404).json({ message: "Diagnosis log not found or unauthorized" });
    }

    res.status(200).json({
      success: true,
      message: "Diagnosis log deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete log", error });
  }
};

// @desc    Clear all user diagnosis history
// @route   DELETE /api/history
// @access  Private
export const clearHistory = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    await DiagnosisHistory.deleteMany({ user: userId });

    res.status(200).json({
      success: true,
      message: "Diagnosis history cleared successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to clear history", error });
  }
};

// @desc    Update user feedback status on a diagnosis
// @route   PUT /api/history/:id/feedback
// @access  Private
export const updateFeedback = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { status } = req.body;

    if (!status || !["confirmed", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ message: "Invalid feedback status" });
    }

    const log = await DiagnosisHistory.findOne({ _id: req.params.id, user: userId });
    if (!log) {
      return res.status(404).json({ message: "Diagnosis record not found" });
    }

    log.feedbackStatus = status;
    await log.save();

    res.status(200).json({
      success: true,
      message: `Feedback status updated to ${status}`,
      feedbackStatus: log.feedbackStatus,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update feedback", error });
  }
};
