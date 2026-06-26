import { Router, Request, Response } from 'express';
import SpecialistOffer from '../models/specialist_offer_model';
import { logger } from '../utils/logger';
import { protect, admin } from '../middlewares/auth_middleware';
import { validateRequest } from '../middlewares/validate_request_middleware';
import { adminOffersQuerySchema, adminModerationSchema } from '../validation/specialist_offer_schemas';

const router = Router();

// Admin list offers with cursor pagination
router.get('/', protect, admin, validateRequest(adminOffersQuerySchema), async (req: Request, res: Response) => {
  try {
    const { cursor, limit, status, adminStatus, farmerId, specialistId } = req.query;
    const qLimit = limit ? parseInt(limit as string, 10) : 20;

    const query: any = {};
    if (status) query.status = status;
    if (adminStatus) query.adminStatus = adminStatus;
    if (farmerId) query.farmer = farmerId;
    if (specialistId) query.specialist = specialistId;
    if (cursor) query._id = { $lt: cursor };

    const offers = await SpecialistOffer.find(query)
      .sort({ _id: -1 })
      .limit(qLimit + 1);

    const hasNextPage = offers.length > qLimit;
    if (hasNextPage) offers.pop();

    const nextCursor = offers.length > 0 ? offers[offers.length - 1]._id : null;

    const toPayload = (offer: any) => ({
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

    logger.info('Listed admin specialist offers', { event: 'admin.specialist_offers.list', requestId: (req as any).id, limit: qLimit });
    return res.status(200).json({ 
      success: true, 
      data: {
        items: offers.map(toPayload),
        pageInfo: { hasNextPage, nextCursor }
      } 
    });
  } catch (error) {
    logger.error('Failed to list specialist offers', { event: 'admin.specialist_offers.list.error', error });
    return res.status(500).json({ success: false, message: 'Failed to list specialist offers' });
  }
});

// Admin moderate offer
router.patch('/:id/moderation', protect, admin, validateRequest(adminModerationSchema), async (req: Request, res: Response) => {
  try {
    const { action, reason, version } = req.body;
    
    const offer = await SpecialistOffer.findById(req.params.id);
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

    logger.info('Moderated admin specialist offer', { 
      event: 'admin.specialist_offers.moderate', 
      requestId: (req as any).id, 
      offerId: offer._id, 
      action,
      adminStatus: newAdminStatus,
      reason
    });
    
    return res.status(200).json({ success: true, data: { offer: { id: offer._id, adminStatus: offer.adminStatus } } });
  } catch (error) {
    logger.error('Failed to update admin status', { event: 'admin.specialist_offers.moderate.error', error });
    return res.status(500).json({ success: false, message: 'Failed to update admin status' });
  }
});

export default router;


