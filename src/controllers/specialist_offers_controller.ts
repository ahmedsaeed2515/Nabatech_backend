import { Request, Response } from "express";
import CommunityPost from "../models/community_post_model";
import SpecialistOffer from "../models/specialist_offer_model";
import User from "../models/user_model";
import { logger } from '../utils/logger';

const toOfferPayload = (offer: any) => ({
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
export const createSpecialistOffer = async (req: Request, res: Response) => {
  try {
    const specialistUser = (req as any).user;
    
    if (specialistUser.role !== 'expert') {
      return res.status(403).json({ success: false, message: 'AUTH_FORBIDDEN', code: 'AUTH_FORBIDDEN' });
    }

    const { postId, plan, price, clientOperationId } = req.body as {
      postId: string;
      plan: string;
      price: number;
      clientOperationId: string;
    };

    if (!postId || !plan || price === undefined || !clientOperationId) {
      return res.status(400).json({ success: false, message: 'VALIDATION_FAILED', code: 'VALIDATION_FAILED' });
    }

    const existing = await SpecialistOffer.findOne({
      specialist: specialistUser._id,
      post: postId,
      clientOperationId,
    });
    
    if (existing) {
      return res.status(201).json({ success: true, data: { offer: toOfferPayload(existing) } });
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found', code: 'RESOURCE_NOT_FOUND' });
    }

    const farmer = await User.findById(post.author);
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer user not found', code: 'RESOURCE_NOT_FOUND' });
    }

    const offer = await SpecialistOffer.create({
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

    logger.info('Specialist offer created', {
      event: 'specialist_offers.create',
      requestId: (req as any).id,
      actorId: specialistUser._id,
      targetId: offer._id,
      payload: { postId, plan, price, clientOperationId },
    });

    return res.status(201).json({ success: true, data: { offer: toOfferPayload(offer) } });
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'Conflict on create', code: 'CONFLICT' });
    }
    logger.error('Failed to create specialist offer', { event: 'specialist_offers.create.error', error });
    return res.status(500).json({ success: false, message: 'Failed to create specialist offer' });
  }
};

// @desc    Get offers created by specialist
// @route   GET /api/community/offers/sent
// @access  Private
export const getSentSpecialistOffers = async (req: Request, res: Response) => {
  try {
    const specialistId = (req as any).user.id;
    const { cursor, limit, status } = req.query;
    const qLimit = limit ? parseInt(limit as string, 10) : 50;

    const query: any = { specialist: specialistId };
    if (status) query.status = status;
    if (cursor) query._id = { $lt: cursor };

    const offers = await SpecialistOffer.find(query).sort({ _id: -1 }).limit(qLimit + 1);

    const hasNextPage = offers.length > qLimit;
    if (hasNextPage) offers.pop();
    const nextCursor = offers.length > 0 ? offers[offers.length - 1]._id : null;

    return res.status(200).json({ 
      success: true, 
      data: { 
        items: offers.map((offer) => toOfferPayload(offer)),
        pageInfo: { hasNextPage, nextCursor }
      } 
    });
  } catch (error) {
    logger.error('Failed to fetch sent offers', { event: 'specialist_offers.list_sent.error', error });
    return res.status(500).json({ success: false, message: "Failed to fetch sent offers" });
  }
};

// @desc    Get offers received by farmer
// @route   GET /api/community/offers/received
// @access  Private
export const getReceivedSpecialistOffers = async (req: Request, res: Response) => {
  try {
    const farmerId = (req as any).user.id;
    const { cursor, limit, status } = req.query;
    const qLimit = limit ? parseInt(limit as string, 10) : 50;

    const query: any = { farmer: farmerId };
    if (status) query.status = status;
    if (cursor) query._id = { $lt: cursor };

    const offers = await SpecialistOffer.find(query).sort({ _id: -1 }).limit(qLimit + 1);

    const hasNextPage = offers.length > qLimit;
    if (hasNextPage) offers.pop();
    const nextCursor = offers.length > 0 ? offers[offers.length - 1]._id : null;

    return res.status(200).json({ 
      success: true, 
      data: { 
        items: offers.map((offer) => toOfferPayload(offer)),
        pageInfo: { hasNextPage, nextCursor }
      } 
    });
  } catch (error) {
    logger.error('Failed to fetch received offers', { event: 'specialist_offers.list_received.error', error });
    return res.status(500).json({ success: false, message: "Failed to fetch received offers" });
  }
};

// @desc    Update offer status
// @route   PATCH /api/community/offers/:id/status
// @access  Private
export const updateSpecialistOfferStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { status, version } = req.body;

    const offer = await SpecialistOffer.findById(req.params.id);
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
      } else if (isSpecialist && (status === 'withdrawn' || status === 'cancelled')) {
        isValidTransition = true;
      }
    } else if (offer.status === 'accepted') {
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
    if (status === 'accepted') offer.acceptedAt = new Date();
    else if (status === 'rejected') offer.rejectedAt = new Date();
    else if (status === 'withdrawn') (offer as any).withdrawnAt = new Date();
    else if (status === 'cancelled') offer.cancelledAt = new Date();

    offer.version += 1;
    await offer.save();

    logger.info('Specialist offer status updated', {
      event: 'specialist_offers.update_status',
      requestId: (req as any).id,
      actorId: userId,
      offerId: offer._id,
      newStatus: status,
      version: offer.version,
    });

    return res.status(200).json({ success: true, data: { offer: toOfferPayload(offer) } });
  } catch (error) {
    logger.error('Failed to update offer status', { event: 'specialist_offers.update_status.error', error });
    return res.status(500).json({ success: false, message: "Failed to update offer status" });
  }
};

