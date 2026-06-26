"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSpecialistOfferStatus = exports.getReceivedSpecialistOffers = exports.getSentSpecialistOffers = exports.createSpecialistOffer = void 0;
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const specialist_offer_model_1 = __importDefault(require("../models/specialist_offer_model"));
const user_model_1 = __importDefault(require("../models/user_model"));
const logger_1 = require("../utils/logger");
const toOfferPayload = (offer) => ({
    id: offer._id.toString(),
    postId: offer.post?.toString() || offer.post,
    specialistId: offer.specialist?.toString() || offer.specialist,
    specialistName: offer.specialistName,
    farmerId: offer.farmer?.toString() || offer.farmer,
    farmerName: offer.farmerName,
    plan: offer.plan,
    price: offer.price,
    status: offer.status,
    version: offer.version ?? 1,
    createdAt: offer.createdAt?.toISOString ? offer.createdAt.toISOString() : offer.createdAt,
});
// @desc    Create specialist cure plan offer
// @route   POST /api/community/offers
// @access  Private
const createSpecialistOffer = async (req, res) => {
    try {
        const specialistUser = req.user;
        if (specialistUser.role !== 'expert') {
            return res.status(403).json({ success: false, message: 'AUTH_FORBIDDEN', code: 'AUTH_FORBIDDEN' });
        }
        const { postId, plan, price, clientOperationId } = req.body;
        if (!postId || !plan || price === undefined || !clientOperationId) {
            return res.status(400).json({ success: false, message: 'VALIDATION_FAILED', code: 'VALIDATION_FAILED' });
        }
        const existing = await specialist_offer_model_1.default.findOne({
            specialist: specialistUser._id,
            post: postId,
            clientOperationId,
        });
        if (existing) {
            return res.status(201).json({ success: true, data: { offer: toOfferPayload(existing) } });
        }
        const post = await community_post_model_1.default.findById(postId);
        if (!post) {
            return res.status(404).json({ success: false, message: 'Post not found', code: 'RESOURCE_NOT_FOUND' });
        }
        const farmer = await user_model_1.default.findById(post.author);
        if (!farmer) {
            return res.status(404).json({ success: false, message: 'Farmer user not found', code: 'RESOURCE_NOT_FOUND' });
        }
        const offer = await specialist_offer_model_1.default.create({
            post: post._id,
            specialist: specialistUser._id,
            specialistName: specialistUser.name,
            farmer: farmer._id,
            farmerName: farmer.name,
            plan: String(plan).trim(),
            price: Number(price),
            status: 'pending',
            clientOperationId,
            version: 0,
        });
        logger_1.logger.info('Specialist offer created', {
            event: 'specialist_offers.create',
            requestId: req.id,
            actorId: specialistUser._id,
            targetId: offer._id,
            payload: { postId, plan, price, clientOperationId },
        });
        return res.status(201).json({ success: true, data: { offer: toOfferPayload(offer) } });
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ success: false, message: 'Conflict on create', code: 'CONFLICT' });
        }
        logger_1.logger.error('Failed to create specialist offer', { event: 'specialist_offers.create.error', error });
        return res.status(500).json({ success: false, message: 'Failed to create specialist offer' });
    }
};
exports.createSpecialistOffer = createSpecialistOffer;
// @desc    Get offers created by specialist
// @route   GET /api/community/offers/sent
// @access  Private
const getSentSpecialistOffers = async (req, res) => {
    try {
        const specialistId = req.user.id;
        const { cursor, limit, status } = req.query;
        const qLimit = limit ? parseInt(limit, 10) : 50;
        const query = { specialist: specialistId };
        if (status)
            query.status = status;
        if (cursor)
            query._id = { $lt: cursor };
        const offers = await specialist_offer_model_1.default.find(query).sort({ _id: -1 }).limit(qLimit + 1);
        const hasNextPage = offers.length > qLimit;
        if (hasNextPage)
            offers.pop();
        const nextCursor = offers.length > 0 ? offers[offers.length - 1]._id : null;
        return res.status(200).json({
            success: true,
            data: {
                items: offers.map((offer) => toOfferPayload(offer)),
                pageInfo: { hasNextPage, nextCursor }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch sent offers', { event: 'specialist_offers.list_sent.error', error });
        return res.status(500).json({ success: false, message: "Failed to fetch sent offers" });
    }
};
exports.getSentSpecialistOffers = getSentSpecialistOffers;
// @desc    Get offers received by farmer
// @route   GET /api/community/offers/received
// @access  Private
const getReceivedSpecialistOffers = async (req, res) => {
    try {
        const farmerId = req.user.id;
        const { cursor, limit, status } = req.query;
        const qLimit = limit ? parseInt(limit, 10) : 50;
        const query = { farmer: farmerId };
        if (status)
            query.status = status;
        if (cursor)
            query._id = { $lt: cursor };
        const offers = await specialist_offer_model_1.default.find(query).sort({ _id: -1 }).limit(qLimit + 1);
        const hasNextPage = offers.length > qLimit;
        if (hasNextPage)
            offers.pop();
        const nextCursor = offers.length > 0 ? offers[offers.length - 1]._id : null;
        return res.status(200).json({
            success: true,
            data: {
                items: offers.map((offer) => toOfferPayload(offer)),
                pageInfo: { hasNextPage, nextCursor }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to fetch received offers', { event: 'specialist_offers.list_received.error', error });
        return res.status(500).json({ success: false, message: "Failed to fetch received offers" });
    }
};
exports.getReceivedSpecialistOffers = getReceivedSpecialistOffers;
// @desc    Update offer status
// @route   PATCH /api/community/offers/:id/status
// @access  Private
const updateSpecialistOfferStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const { status, version } = req.body;
        const offer = await specialist_offer_model_1.default.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ error: "Offer not found", errorCode: 'RESOURCE_NOT_FOUND' });
        }
        // Optimistic concurrency check
        if (offer.version !== version) {
            return res.status(409).json({ error: "Version conflict — offer was modified by another request", errorCode: 'CONFLICT' });
        }
        // Terminal state check
        if (offer.status === 'rejected' || offer.status === 'withdrawn' || offer.status === 'cancelled') {
            return res.status(400).json({
                error: `Invalid state transition from '${offer.status}' to '${status}'`,
                errorCode: 'INVALID_STATE_TRANSITION'
            });
        }
        const isFarmer = offer.farmer.toString() === userId;
        const isSpecialist = offer.specialist.toString() === userId;
        // Full state transition matrix per spec
        let isValidTransition = false;
        if (offer.status === 'pending') {
            if (isFarmer && (status === 'accepted' || status === 'rejected')) {
                isValidTransition = true;
            }
            else if (isSpecialist && (status === 'withdrawn' || status === 'cancelled')) {
                isValidTransition = true;
            }
        }
        else if (offer.status === 'accepted') {
            if (isSpecialist && (status === 'withdrawn' || status === 'cancelled')) {
                isValidTransition = true;
            }
        }
        if (!isValidTransition) {
            if (!isFarmer && !isSpecialist) {
                return res.status(403).json({ error: "Not authorized to modify this offer", errorCode: 'AUTH_FORBIDDEN' });
            }
            return res.status(400).json({
                error: `Invalid state transition from '${offer.status}' to '${status}'`,
                errorCode: 'INVALID_STATE_TRANSITION'
            });
        }
        offer.status = status;
        if (status === 'accepted')
            offer.acceptedAt = new Date();
        else if (status === 'rejected')
            offer.rejectedAt = new Date();
        else if (status === 'withdrawn')
            offer.withdrawnAt = new Date();
        else if (status === 'cancelled')
            offer.cancelledAt = new Date();
        offer.version += 1;
        await offer.save();
        // Send notifications
        try {
            const { NotificationService } = await Promise.resolve().then(() => __importStar(require("../services/NotificationService")));
            if (status === 'accepted') {
                await NotificationService.sendNotification({
                    userId: offer.specialist.toString(),
                    actorId: userId,
                    type: 'CONSULTATION_ACCEPTED',
                    entityId: offer._id.toString(),
                    entityType: 'Consultation', // General entity type, assuming SpecialistOffer falls under it
                    title: 'Offer Accepted',
                    message: `Your consultation offer has been accepted.`
                });
            }
            else if (status === 'rejected') {
                await NotificationService.sendNotification({
                    userId: offer.specialist.toString(),
                    actorId: userId,
                    type: 'CONSULTATION_REJECTED',
                    entityId: offer._id.toString(),
                    entityType: 'Consultation',
                    title: 'Offer Rejected',
                    message: `Your consultation offer has been rejected.`
                });
            }
        }
        catch (notifyErr) {
            logger_1.logger.error('Failed to send consultation accepted/rejected notification', { error: notifyErr });
        }
        logger_1.logger.info('Specialist offer status updated', {
            event: 'specialist_offers.update_status',
            requestId: req.id,
            actorId: userId,
            offerId: offer._id,
            newStatus: status,
            version: offer.version,
        });
        return res.status(200).json({ success: true, data: { offer: toOfferPayload(offer) } });
    }
    catch (error) {
        logger_1.logger.error('Failed to update offer status', { event: 'specialist_offers.update_status.error', error });
        return res.status(500).json({ success: false, message: "Failed to update offer status" });
    }
};
exports.updateSpecialistOfferStatus = updateSpecialistOfferStatus;
