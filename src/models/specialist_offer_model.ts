import mongoose, { Document, Schema } from "mongoose";

export type SpecialistOfferStatus = "pending" | "accepted" | "rejected" | "cancelled";

export interface ISpecialistOffer extends Document {
  post: mongoose.Types.ObjectId;
  specialist: mongoose.Types.ObjectId;
  specialistName: string;
  farmer: mongoose.Types.ObjectId;
  farmerName: string;
  plan: string;
  price: number;
  status: SpecialistOfferStatus;
  clientOperationId?: string;
  version: number;
  acceptedAt?: Date;
  rejectedAt?: Date;
  cancelledAt?: Date;
  adminStatus?: 'flagged' | 'cleared' | 'voided';
  createdAt: Date;
  updatedAt: Date;
}

const specialistOfferSchema = new Schema<ISpecialistOffer>(
  {
    post: { type: Schema.Types.ObjectId, ref: "CommunityPost", required: true, index: true },
    specialist: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    specialistName: { type: String, required: true, trim: true },
    farmer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    farmerName: { type: String, required: true, trim: true },
    plan: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
    },
    clientOperationId: { type: String, required: false, index: true },
    version: { type: Number, default: 0 },
    acceptedAt: { type: Date },
    rejectedAt: { type: Date },
    cancelledAt: { type: Date },
    adminStatus: { type: String, enum: ["flagged", "cleared", "voided"], default: undefined },
  },
  { timestamps: true }
);

// Indexes for fast lookup and idempotency
specialistOfferSchema.index({ farmer: 1, createdAt: -1 });
specialistOfferSchema.index({ specialist: 1, createdAt: -1 });
specialistOfferSchema.index({ specialist: 1, post: 1, clientOperationId: 1 }, { unique: true, sparse: true });

export default mongoose.model<ISpecialistOffer>("SpecialistOffer", specialistOfferSchema);

