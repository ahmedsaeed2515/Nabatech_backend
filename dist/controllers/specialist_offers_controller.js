"use strict";
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
    id: offer._id,
    postId: offer.post,
    specialistId: offer.specialist,
    specialistName: offer.specialistName,
    farmerId: offer.farmer,
    farmerName: offer.farmerName,
    plan: offer.plan,
    price: offer.price,
    status: offer.status,
    createdAt: offer.createdAt,
});
// @desc    Create specialist cure plan offer
// @route   POST /api/community/offers
// @access  Private
const createSpecialistOffer = async (req, res) => {
    try {
        const specialistUser = req.user;
        if (specialistUser.accountType !== 'specialist' || !specialistUser.specialistVerifiedAt) {
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
            return res.status(404).json({ success: false, message: "Offer not found", code: 'RESOURCE_NOT_FOUND' });
        }
        if (offer.version !== version) {
            return res.status(409).json({ success: false, message: "Version mismatch", code: 'CONFLICT' });
        }
        if (offer.status !== 'pending') {
            return res.status(400).json({ success: false, message: "Offer is no longer pending", code: 'INVALID_STATE_TRANSITION' });
        }
        let isValidTransition = false;
        if (offer.farmer.toString() === userId) {
            isValidTransition = status === 'accepted' || status === 'rejected';
        }
        else if (offer.specialist.toString() === userId) {
            isValidTransition = status === 'cancelled';
        }
        if (!isValidTransition) {
            return res.status(403).json({ success: false, message: "Not authorized or invalid state transition", code: 'AUTH_FORBIDDEN' });
        }
        offer.status = status;
        if (status === 'accepted')
            offer.acceptedAt = new Date();
        else if (status === 'rejected')
            offer.rejectedAt = new Date();
        else if (status === 'cancelled')
            offer.cancelledAt = new Date();
        offer.version += 1;
        await offer.save();
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
