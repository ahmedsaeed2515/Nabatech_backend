import { Request, Response } from "express";
import Reminder from "../models/reminder_model";

// @desc    Get all reminders of the user
// @route   GET /api/reminders
// @access  Private
export const getReminders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const reminders = await Reminder.find({ user: userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reminders.length,
      reminders: reminders.map(r => ({
        id: r._id,
        title: r.title,
        plantName: r.plantName,
        timeLabel: r.timeLabel,
        iconCodePoint: r.iconCodePoint,
        enabled: r.enabled,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch reminders", error });
  }
};

// @desc    Create a reminder
// @route   POST /api/reminders
// @access  Private
export const createReminder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title, plantName, timeLabel, iconCodePoint, enabled } = req.body;

    if (!title || !plantName || !timeLabel) {
      return res.status(400).json({ message: "Title, plant name and schedule details are required" });
    }

    const reminder = await Reminder.create({
      user: userId,
      title: title.trim(),
      plantName: plantName.trim(),
      timeLabel: timeLabel.trim(),
      iconCodePoint: iconCodePoint !== undefined ? Number(iconCodePoint) : undefined,
      enabled: enabled !== undefined ? Boolean(enabled) : true,
    });

    res.status(201).json({
      success: true,
      reminder: {
        id: reminder._id,
        title: reminder.title,
        plantName: reminder.plantName,
        timeLabel: reminder.timeLabel,
        iconCodePoint: reminder.iconCodePoint,
        enabled: reminder.enabled,
        createdAt: reminder.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to create reminder", error });
  }
};

// @desc    Update a reminder
// @route   PUT /api/reminders/:id
// @access  Private
export const updateReminder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title, plantName, timeLabel, iconCodePoint, enabled } = req.body;

    const reminder = await Reminder.findOne({ _id: req.params.id, user: userId });
    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found" });
    }

    if (title !== undefined) reminder.title = title.trim();
    if (plantName !== undefined) reminder.plantName = plantName.trim();
    if (timeLabel !== undefined) reminder.timeLabel = timeLabel.trim();
    if (iconCodePoint !== undefined) reminder.iconCodePoint = Number(iconCodePoint);
    if (enabled !== undefined) reminder.enabled = Boolean(enabled);

    await reminder.save();

    res.status(200).json({
      success: true,
      reminder: {
        id: reminder._id,
        title: reminder.title,
        plantName: reminder.plantName,
        timeLabel: reminder.timeLabel,
        iconCodePoint: reminder.iconCodePoint,
        enabled: reminder.enabled,
        createdAt: reminder.createdAt,
      }
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to update reminder", error });
  }
};

// @desc    Delete a reminder
// @route   DELETE /api/reminders/:id
// @access  Private
export const deleteReminder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const reminder = await Reminder.findOneAndDelete({ _id: req.params.id, user: userId });

    if (!reminder) {
      return res.status(404).json({ message: "Reminder not found or unauthorized" });
    }

    res.status(200).json({
      success: true,
      message: "Reminder deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete reminder", error });
  }
};
