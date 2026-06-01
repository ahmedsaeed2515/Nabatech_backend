import { Request, Response } from "express";
import CommunityPost from "../models/community_post_model";
import SpecialistOffer from "../models/specialist_offer_model";
import User from "../models/user_model";

const toOfferPayload = (offer: any) => ({
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
export const createSpecialistOffer = async (req: Request, res: Response) => {
  try {
    const specialistUser = (req as any).user;
    const { postId, plan, price } = req.body;

    if (!postId || !plan || price === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "postId, plan and price are required" });
    }

    const post = await CommunityPost.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const farmer = await User.findById(post.author);
    if (!farmer) {
      return res.status(404).json({ success: false, message: "Farmer user not found" });
    }

    const offer = await SpecialistOffer.create({
      post: post._id,
      specialist: specialistUser._id,
      specialistName: specialistUser.name,
      farmer: farmer._id,
      farmerName: farmer.name,
      plan: String(plan).trim(),
      price: Number(price),
      status: "pending",
    });

    return res.status(201).json({ success: true, data: toOfferPayload(offer) });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to create specialist offer" });
  }
};

// @desc    Get offers created by specialist
// @route   GET /api/community/offers/sent
// @access  Private
export const getSentSpecialistOffers = async (req: Request, res: Response) => {
  try {
    const specialistId = (req as any).user.id;
    const offers = await SpecialistOffer.find({ specialist: specialistId }).sort({
      createdAt: -1,
    });
    return res
      .status(200)
      .json({ success: true, data: offers.map((offer) => toOfferPayload(offer)) });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch sent offers" });
  }
};

// @desc    Get offers received by farmer
// @route   GET /api/community/offers/received
// @access  Private
export const getReceivedSpecialistOffers = async (req: Request, res: Response) => {
  try {
    const farmerId = (req as any).user.id;
    const offers = await SpecialistOffer.find({ farmer: farmerId }).sort({
      createdAt: -1,
    });
    return res
      .status(200)
      .json({ success: true, data: offers.map((offer) => toOfferPayload(offer)) });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch received offers" });
  }
};

// @desc    Update offer status
// @route   PATCH /api/community/offers/:id/status
// @access  Private
export const updateSpecialistOfferStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { status } = req.body;
    const allowed = ["pending", "accepted", "rejected", "cancelled"];

    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid offer status" });
    }

    const offer = await SpecialistOffer.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }

    const canUpdate =
      offer.farmer.toString() === userId || offer.specialist.toString() === userId;
    if (!canUpdate) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    offer.status = status;
    await offer.save();

    return res.status(200).json({ success: true, data: toOfferPayload(offer) });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Failed to update offer status" });
  }
};

