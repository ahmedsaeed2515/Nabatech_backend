import { Request, Response } from "express";
import Consultation from "../models/consultation_model";
import User from "../models/user_model";
import { logger } from "../utils/logger";
import { NotificationService } from '../services/NotificationService';

// @desc    Book a consultation
// @route   POST /api/community/consultations
// @access  Private
export const bookConsultation = async (req: Request, res: Response) => {
  try {
    const farmerId = (req as any).user.id;
    const { expertId, day, time, attachments, notes, clientOperationId } = req.body;

    if (!expertId || !day || !time || !clientOperationId) {
      return res.status(400).json({ error: "Missing required fields", errorCode: "VALIDATION_FAILED" });
    }

    if (clientOperationId) {
      const existing = await Consultation.findOne({ clientOperationId }).populate('expert', 'name');
      if (existing) {
        return res.status(201).json({
          data: {
            consultation: {
              id: existing._id.toString(),
              expertId: existing.expert?._id?.toString() || expertId,
              expertName: (existing.expert as any)?.name || "Unknown",
              scheduledAt: existing.scheduledAt.toISOString(),
              status: existing.status,
              createdAt: existing.createdAt.toISOString()
            }
          }
        });
      }
    }

    const expert = await User.findById(expertId);
    if (!expert || expert.role !== 'expert' && expert.role !== ('agronomist' as any)) {
      return res.status(404).json({ error: "Expert not found", errorCode: "RESOURCE_NOT_FOUND" });
    }

    const scheduledAt = new Date(`${day}T${time}:00.000Z`);
    if (isNaN(scheduledAt.getTime())) {
      return res.status(400).json({ error: "Invalid day or time format", errorCode: "VALIDATION_FAILED" });
    }

    const consultation = await Consultation.create({
      expert: expertId,
      farmer: farmerId,
      scheduledAt,
      notes,
      attachments: attachments || [],
      clientOperationId,
      status: 'pending'
    });

    NotificationService.sendNotification({
      userId: expertId,
      actorId: farmerId,
      type: 'CONSULTATION_REQUEST',
      entityId: consultation._id.toString(),
      entityType: 'Consultation',
      title: 'Consultation Request',
      message: `${(req as any).user.name || 'A user'} requested a consultation with you.`
    }).catch(e => logger.error('Error sending consultation notification', { error: e }));

    res.status(201).json({
      data: {
        consultation: {
          id: consultation._id.toString(),
          expertId: expert._id.toString(),
          expertName: expert.name,
          scheduledAt: consultation.scheduledAt.toISOString(),
          status: consultation.status,
          createdAt: consultation.createdAt.toISOString()
        }
      }
    });

  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ error: "Conflict on create", errorCode: "CONFLICT" });
    }
    logger.error('Failed to book consultation', { error });
    res.status(500).json({ error: "Failed to book consultation" });
  }
};

// @desc    Get my consultations
// @route   GET /api/community/consultations/me
// @access  Private
export const getMyConsultations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    
    const consultations = await Consultation.find({
      $or: [{ farmer: userId }, { expert: userId }]
    })
    .populate('expert', 'name')
    .sort({ scheduledAt: 1 });

    const items = consultations.map(consultation => ({
      id: consultation._id.toString(),
      expertId: consultation.expert?._id?.toString() || consultation.expert,
      expertName: (consultation.expert as any)?.name || "Unknown",
      scheduledAt: consultation.scheduledAt.toISOString(),
      status: consultation.status,
      createdAt: consultation.createdAt.toISOString()
    }));

    res.status(200).json({
      success: true,
      data: {
        items
      }
    });
  } catch (error) {
    logger.error('Failed to fetch consultations', { error });
    res.status(500).json({ error: "Failed to fetch consultations" });
  }
};


