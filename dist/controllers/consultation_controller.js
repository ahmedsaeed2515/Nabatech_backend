"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyConsultations = exports.bookConsultation = void 0;
const consultation_model_1 = __importDefault(require("../models/consultation_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
const logger_1 = require("../utils/logger");
// @desc    Book a consultation
// @route   POST /api/community/consultations
// @access  Private
const bookConsultation = async (req, res) => {
    try {
        const farmerId = req.user.id;
        const { expertId, day, time, attachments, notes, clientOperationId } = req.body;
        if (!expertId || !day || !time || !clientOperationId) {
            return res.status(400).json({ error: "Missing required fields", errorCode: "VALIDATION_FAILED" });
        }
        if (clientOperationId) {
            const existing = await consultation_model_1.default.findOne({ clientOperationId }).populate('expert', 'name');
            if (existing) {
                return res.status(201).json({
                    data: {
                        consultation: {
                            id: existing._id.toString(),
                            expertId: existing.expert?._id?.toString() || expertId,
                            expertName: existing.expert?.name || "Unknown",
                            scheduledAt: existing.scheduledAt.toISOString(),
                            status: existing.status,
                            createdAt: existing.createdAt.toISOString()
                        }
                    }
                });
            }
        }
        const expert = await user_model_1.default.findById(expertId);
        if (!expert || expert.role !== 'expert' && expert.role !== 'agronomist') {
            return res.status(404).json({ error: "Expert not found", errorCode: "RESOURCE_NOT_FOUND" });
        }
        const scheduledAt = new Date(`${day}T${time}:00.000Z`);
        if (isNaN(scheduledAt.getTime())) {
            return res.status(400).json({ error: "Invalid day or time format", errorCode: "VALIDATION_FAILED" });
        }
        const consultation = await consultation_model_1.default.create({
            expert: expertId,
            farmer: farmerId,
            scheduledAt,
            notes,
            attachments: attachments || [],
            clientOperationId,
            status: 'pending'
        });
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
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ error: "Conflict on create", errorCode: "CONFLICT" });
        }
        logger_1.logger.error('Failed to book consultation', { error });
        res.status(500).json({ error: "Failed to book consultation" });
    }
};
exports.bookConsultation = bookConsultation;
// @desc    Get my consultations
// @route   GET /api/community/consultations/me
// @access  Private
const getMyConsultations = async (req, res) => {
    try {
        const userId = req.user.id;
        const consultations = await consultation_model_1.default.find({
            $or: [{ farmer: userId }, { expert: userId }]
        })
            .populate('expert', 'name')
            .sort({ scheduledAt: 1 });
        const items = consultations.map(consultation => ({
            id: consultation._id.toString(),
            expertId: consultation.expert?._id?.toString() || consultation.expert,
            expertName: consultation.expert?.name || "Unknown",
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
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch consultations', { error });
        res.status(500).json({ error: "Failed to fetch consultations" });
    }
};
exports.getMyConsultations = getMyConsultations;
