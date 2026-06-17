"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const specialist_offer_model_1 = __importDefault(require("../models/specialist_offer_model"));
const logger_1 = require("../utils/logger");
const auth_middleware_1 = require("../middlewares/auth_middleware");
const validate_request_middleware_1 = require("../middlewares/validate_request_middleware");
const specialist_offer_schemas_1 = require("../validation/specialist_offer_schemas");
const router = (0, express_1.Router)();
// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user && req.user.accountType === 'admin') {
        next();
    }
    else {
        return res.status(403).json({ success: false, message: 'Admin access required', code: 'AUTH_FORBIDDEN' });
    }
};
// Admin list offers with cursor pagination
router.get('/', auth_middleware_1.protect, requireAdmin, (0, validate_request_middleware_1.validateRequest)(specialist_offer_schemas_1.adminOffersQuerySchema), async (req, res) => {
    try {
        const { cursor, limit, status, adminStatus, farmerId, specialistId } = req.query;
        const qLimit = limit ? parseInt(limit, 10) : 20;
        const query = {};
        if (status)
            query.status = status;
        if (adminStatus)
            query.adminStatus = adminStatus;
        if (farmerId)
            query.farmer = farmerId;
        if (specialistId)
            query.specialist = specialistId;
        if (cursor)
            query._id = { $lt: cursor };
        const offers = await specialist_offer_model_1.default.find(query)
            .sort({ _id: -1 })
            .limit(qLimit + 1);
        const hasNextPage = offers.length > qLimit;
        if (hasNextPage)
            offers.pop();
        const nextCursor = offers.length > 0 ? offers[offers.length - 1]._id : null;
        const toPayload = (offer) => ({
            id: offer._id,
            postId: offer.post,
            specialistId: offer.specialist,
            specialistName: offer.specialistName,
            farmerId: offer.farmer,
            farmerName: offer.farmerName,
            plan: offer.plan,
            price: offer.price,
            status: offer.status,
            adminStatus: offer.adminStatus,
            createdAt: offer.createdAt,
        });
        logger_1.logger.info('Listed admin specialist offers', { event: 'admin.specialist_offers.list', requestId: req.id, limit: qLimit });
        return res.status(200).json({
            success: true,
            data: {
                items: offers.map(toPayload),
                pageInfo: { hasNextPage, nextCursor }
            }
        });
    }
    catch (error) {
        logger_1.logger.error('Failed to list specialist offers', { event: 'admin.specialist_offers.list.error', error });
        return res.status(500).json({ success: false, message: 'Failed to list specialist offers' });
    }
});
// Admin moderate offer
router.patch('/:id/moderation', auth_middleware_1.protect, requireAdmin, (0, validate_request_middleware_1.validateRequest)(specialist_offer_schemas_1.adminModerationSchema), async (req, res) => {
    try {
        const { action, reason, version } = req.body;
        const offer = await specialist_offer_model_1.default.findById(req.params.id);
        if (!offer) {
            return res.status(404).json({ success: false, message: 'Offer not found', code: 'RESOURCE_NOT_FOUND' });
        }
        if (offer.version !== version) {
            return res.status(409).json({ success: false, message: 'Version mismatch', code: 'CONFLICT' });
        }
        const newAdminStatus = action === 'flag' ? 'flagged' : action === 'clear' ? 'cleared' : 'voided';
        offer.adminStatus = newAdminStatus;
        // Note: Do not change the normal business status or accept/reject.
        // If we wanted to store the admin reason, we could add a field `adminModerationReason` to the model.
        offer.version += 1;
        await offer.save();
        logger_1.logger.info('Moderated admin specialist offer', {
            event: 'admin.specialist_offers.moderate',
            requestId: req.id,
            offerId: offer._id,
            action,
            adminStatus: newAdminStatus,
            reason
        });
        return res.status(200).json({ success: true, data: { offer: { id: offer._id, adminStatus: offer.adminStatus } } });
    }
    catch (error) {
        logger_1.logger.error('Failed to update admin status', { event: 'admin.specialist_offers.moderate.error', error });
        return res.status(500).json({ success: false, message: 'Failed to update admin status' });
    }
});
exports.default = router;
