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
  },
  { timestamps: true }
);

export default mongoose.model<ISpecialistOffer>("SpecialistOffer", specialistOfferSchema);

