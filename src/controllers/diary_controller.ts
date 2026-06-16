import { Request, Response } from "express";
import DiaryEntry from "../models/diary_entry_model";

// @desc    Get all diary entries of the user
// @route   GET /api/diary
// @access  Private
export const getDiaryEntries = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plantId } = req.query;
    const query: any = { user: userId };
    if (plantId) query.plantId = plantId;
    
    const entries = await DiaryEntry.find(query).sort({ date: -1 });

    const payload = entries.map(e => ({
      id: e._id,
      plantId: e.plantId,
      title: e.title,
      notes: e.notes,
      date: e.date,
      moodCode: e.moodCode,
      healthScore: e.healthScore
    }));

    res.status(200).json({
      success: true,
      entries: payload
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch diary entries", error });
  }
};

// @desc    Create a diary entry
// @route   POST /api/diary
// @access  Private
export const createDiaryEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plantId, title, notes, date, moodCode, healthScore } = req.body;

    if (!plantId || !title || !notes) {
      return res.status(400).json({ message: "Plant ID, title and notes are required" });
    }

    const entry = await DiaryEntry.create({
      user: userId,
      plantId: plantId,
      title: title.trim(),
      notes: notes.trim(),
      date: date ? new Date(date) : undefined,
      moodCode: moodCode !== undefined ? Number(moodCode) : undefined,
      healthScore: healthScore !== undefined ? Number(healthScore) : undefined,
    });

    res.status(201).json({
      success: true,
      entry: {
        id: entry._id,
        plantId: entry.plantId,
        title: entry.title,
        notes: entry.notes,
        date: entry.date,
        moodCode: entry.moodCode,
        healthScore: entry.healthScore,
        createdAt: entry.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create diary entry", error });
  }
};

// @desc    Update a diary entry
// @route   PUT /api/diary/:id
// @access  Private
export const updateDiaryEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { plantId, title, notes, date, moodCode, healthScore } = req.body;

    const entry = await DiaryEntry.findOne({ _id: req.params.id, user: userId });
    if (!entry) {
      return res.status(404).json({ message: "Diary entry not found" });
    }

    if (plantId !== undefined) entry.plantId = plantId;
    if (title !== undefined) entry.title = title.trim();
    if (notes !== undefined) entry.notes = notes.trim();
    if (date !== undefined) entry.date = new Date(date);
    if (moodCode !== undefined) entry.moodCode = Number(moodCode);
    if (healthScore !== undefined) entry.healthScore = Number(healthScore);

    await entry.save();

    res.status(200).json({
      success: true,
      entry: {
        id: entry._id,
        plantId: entry.plantId,
        title: entry.title,
        notes: entry.notes,
        date: entry.date,
        moodCode: entry.moodCode,
        healthScore: entry.healthScore,
        createdAt: entry.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update diary entry", error });
  }
};

// @desc    Delete a diary entry
// @route   DELETE /api/diary/:id
// @access  Private
export const deleteDiaryEntry = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const entry = await DiaryEntry.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!entry) {
      return res.status(404).json({ message: "Diary entry not found or unauthorized" });
    }

    res.status(200).json({
      success: true,
      message: "Diary entry deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete diary entry", error });
  }
};
