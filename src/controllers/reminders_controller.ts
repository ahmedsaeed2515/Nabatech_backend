import { Request, Response } from "express";
import Reminder from "../models/reminder_model";
import { validateTimeZone, validateIsoDate, validateRecurrence } from "../validation/reminder_schemas";

// @desc    Get all reminders of the user
// @route   GET /api/reminders
// @access  Private
export const getReminders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { cursor, limit, enabled } = req.query;

    const queryLimit = Math.min(parseInt(limit as string) || 50, 50);
    const query: any = { user: userId };
    
    if (enabled !== undefined) {
      query.enabled = enabled === 'true';
    }

    if (cursor) {
      query._id = { $lt: cursor }; // Cursor pagination descending
    }

    const reminders = await Reminder.find(query)
      .sort({ _id: -1 })
      .limit(queryLimit + 1);

    const hasNextPage = reminders.length > queryLimit;
    if (hasNextPage) reminders.pop();

    const nextCursor = hasNextPage ? reminders[reminders.length - 1]._id : null;

    res.status(200).json({
      data: {
        items: reminders.map(r => ({
          id: r._id,
          title: r.title,
          plantId: r.plantId,
          timeLabel: r.timeLabel,
          iconCodePoint: r.iconCodePoint,
          enabled: r.enabled,
          scheduledAt: r.scheduledAt,
          timeZone: r.timeZone,
          recurrence: r.recurrence,
          clientOperationId: r.clientOperationId,
          version: r.version,
          createdAt: r.createdAt,
        })),
        pageInfo: {
          hasNextPage,
          nextCursor
        }
      },
      // Legacy backward compatibility
      success: true,
      count: reminders.length,
      reminders: reminders.map(r => ({
        id: r._id,
        title: r.title,
        plantId: r.plantId,
        timeLabel: r.timeLabel,
        iconCodePoint: r.iconCodePoint,
        enabled: r.enabled,
        createdAt: r.createdAt,
      })),
    });
  } catch (error) {
    console.error("getReminders Error:", error);
    res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to fetch reminders" });
  }
};

// @desc    Create a reminder
// @route   POST /api/reminders
// @access  Private
export const createReminder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title, plantId, timeLabel, iconCodePoint, enabled, scheduledAt, timeZone, recurrence, clientOperationId } = req.body;

    if (!title || !plantId) {
      return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Title and plantId are required" });
    }

    if (scheduledAt && !validateIsoDate(scheduledAt)) {
      return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid ISO date for scheduledAt" });
    }

    if (timeZone && !validateTimeZone(timeZone)) {
      return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid IANA timeZone" });
    }

    if (recurrence && !validateRecurrence(recurrence)) {
      return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid recurrence value" });
    }

    const reminder = new Reminder({
      user: userId,
      title: title.trim(),
      plantId: plantId,
      timeLabel: timeLabel ? timeLabel.trim() : (scheduledAt ? new Date(scheduledAt).toLocaleTimeString() : 'Review Needed'),
      iconCodePoint: iconCodePoint !== undefined ? Number(iconCodePoint) : undefined,
      enabled: enabled !== undefined ? Boolean(enabled) : true,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      timeZone: timeZone || undefined,
      recurrence: recurrence || undefined,
      clientOperationId: clientOperationId || undefined,
      version: 0,
    });

    try {
      await reminder.save();
      console.info(JSON.stringify({ event: 'reminders.event', action: 'create', actorId: userId, targetId: reminder._id, result: 'success' }));
    } catch (err: any) {
      if (err.code === 11000 && clientOperationId) {
        // Idempotency conflict
        return res.status(409).json({ errorCode: "CONFLICT", message: "Duplicate clientOperationId" });
      }
      throw err;
    }

    const responsePayload = {
      id: reminder._id,
      title: reminder.title,
      plantId: reminder.plantId,
      timeLabel: reminder.timeLabel,
      iconCodePoint: reminder.iconCodePoint,
      enabled: reminder.enabled,
      scheduledAt: reminder.scheduledAt,
      timeZone: reminder.timeZone,
      recurrence: reminder.recurrence,
      clientOperationId: reminder.clientOperationId,
      version: reminder.version,
      createdAt: reminder.createdAt,
    };

    res.status(201).json({
      data: { reminder: responsePayload },
      success: true,
      reminder: responsePayload
    });
  } catch (error) {
    console.error("createReminder Error:", error);
    res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to create reminder" });
  }
};

// @desc    Update a reminder
// @route   PUT /api/reminders/:id
// @access  Private
export const updateReminder = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { title, plantId, timeLabel, iconCodePoint, enabled, scheduledAt, timeZone, recurrence, version } = req.body;

    const reminder = await Reminder.findOne({ _id: req.params.id, user: userId });
    if (!reminder) {
      return res.status(404).json({ errorCode: "RESOURCE_NOT_FOUND", message: "Reminder not found" });
    }

    if (version !== undefined && version !== reminder.version) {
      return res.status(409).json({ errorCode: "CONFLICT", message: "Optimistic concurrency conflict: version mismatch" });
    }

    if (scheduledAt && !validateIsoDate(scheduledAt)) {
      return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid ISO date for scheduledAt" });
    }

    if (timeZone && !validateTimeZone(timeZone)) {
      return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid IANA timeZone" });
    }

    if (recurrence && !validateRecurrence(recurrence)) {
      return res.status(400).json({ errorCode: "VALIDATION_FAILED", message: "Invalid recurrence value" });
    }

    if (title !== undefined) reminder.title = title.trim();
    if (plantId !== undefined) reminder.plantId = plantId;
    if (timeLabel !== undefined) reminder.timeLabel = timeLabel.trim();
    if (iconCodePoint !== undefined) reminder.iconCodePoint = Number(iconCodePoint);
    if (enabled !== undefined) reminder.enabled = Boolean(enabled);
    if (scheduledAt !== undefined) reminder.scheduledAt = scheduledAt ? new Date(scheduledAt) : undefined;
    if (timeZone !== undefined) reminder.timeZone = timeZone || undefined;
    if (recurrence !== undefined) reminder.recurrence = recurrence || undefined;
    
    reminder.version += 1;
    await reminder.save();
    
    console.info(JSON.stringify({ event: 'reminders.event', action: 'update', actorId: userId, targetId: reminder._id, result: 'success' }));

    const responsePayload = {
      id: reminder._id,
      title: reminder.title,
      plantId: reminder.plantId,
      timeLabel: reminder.timeLabel,
      iconCodePoint: reminder.iconCodePoint,
      enabled: reminder.enabled,
      scheduledAt: reminder.scheduledAt,
      timeZone: reminder.timeZone,
      recurrence: reminder.recurrence,
      clientOperationId: reminder.clientOperationId,
      version: reminder.version,
      createdAt: reminder.createdAt,
    };

    res.status(200).json({
      data: { reminder: responsePayload },
      success: true,
      reminder: responsePayload
    });
  } catch (error) {
    console.error("updateReminder Error:", error);
    res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to update reminder" });
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
      return res.status(404).json({ errorCode: "RESOURCE_NOT_FOUND", message: "Reminder not found or unauthorized" });
    }

    console.info(JSON.stringify({ event: 'reminders.event', action: 'delete', actorId: userId, targetId: reminder._id, result: 'success' }));

    res.status(200).json({
      data: { id: reminder._id },
      success: true,
      message: "Reminder deleted successfully"
    });
  } catch (error) {
    console.error("deleteReminder Error:", error);
    res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to delete reminder" });
  }
};

// @desc    Admin: Get all reminders overview
// @route   GET /api/admin/reminders
// @access  Private/Admin
export const getAdminReminders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 100, 100);
    const enabled = req.query.enabled;
    const skip = (page - 1) * limit;

    const query: any = {};
    if (enabled !== undefined) query.enabled = enabled === 'true';

    const [items, total] = await Promise.all([
      Reminder.find(query).sort({ _id: -1 }).skip(skip).limit(limit),
      Reminder.countDocuments(query)
    ]);

    res.status(200).json({
      data: {
        items,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("getAdminReminders Error:", error);
    res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to fetch admin reminders" });
  }
};

// @desc    Admin: Get reminders stats
// @route   GET /api/admin/reminders/stats
// @access  Private/Admin
export const getAdminStats = async (req: Request, res: Response) => {
  try {
    const { from, to, timeZone } = req.query;

    const query: any = {};
    if (from || to) {
      query.createdAt = {};
      if (from) query.createdAt.$gte = new Date(from as string);
      if (to) query.createdAt.$lte = new Date(to as string);
    }
    if (timeZone) {
      query.timeZone = timeZone;
    }

    const [total, enabled, disabled, byDayRaw] = await Promise.all([
      Reminder.countDocuments(query),
      Reminder.countDocuments({ ...query, enabled: true }),
      Reminder.countDocuments({ ...query, enabled: false }),
      Reminder.aggregate([
        { $match: query },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const byDay = byDayRaw.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    res.status(200).json({
      data: {
        total,
        enabled,
        disabled,
        byDay
      }
    });
  } catch (error) {
    console.error("getAdminStats Error:", error);
    res.status(500).json({ errorCode: "INTERNAL_ERROR", message: "Failed to fetch admin reminder stats" });
  }
};
