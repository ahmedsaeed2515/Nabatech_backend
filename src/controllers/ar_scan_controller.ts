import { Request, Response } from "express";
import ArScanSession from "../models/ar_scan_session_model";

const toSessionPayload = (session: any) => ({
  id: session._id,
  mode: session.mode,
  label: session.label,
  createdAt: session.createdAt,
});

// @desc    Get AR scan sessions of current user
// @route   GET /api/explore/ar-scan-sessions
// @access  Private
export const getArScanSessions = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const sessions = await ArScanSession.find({ user: userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      data: sessions.map((session) => toSessionPayload(session)),
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch AR scan sessions" });
  }
};

// @desc    Create AR scan session
// @route   POST /api/explore/ar-scan-sessions
// @access  Private
export const createArScanSession = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { mode, label } = req.body;

    if (!mode || !label) {
      return res
        .status(400)
        .json({ success: false, message: "mode and label are required" });
    }

    const session = await ArScanSession.create({
      user: userId,
      mode: String(mode).trim(),
      label: String(label).trim(),
    });

    return res.status(201).json({ success: true, data: toSessionPayload(session) });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to create AR scan session" });
  }
};

