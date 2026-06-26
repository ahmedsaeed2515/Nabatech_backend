import mongoose, { Document, Schema } from "mongoose";

export interface IConsultation extends Document {
  expert: mongoose.Types.ObjectId;
  farmer: mongoose.Types.ObjectId;
  scheduledAt: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  attachments: string[];
  clientOperationId: string;
  createdAt: Date;
  updatedAt: Date;
}

const consultationSchema = new Schema<IConsultation>(
  {
    expert: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    farmer: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    scheduledAt: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    notes: { type: String, maxlength: 1000 },
    attachments: [{ type: String }],
    clientOperationId: { type: String, required: true, unique: true },
  },
  { timestamps: true }
);

export default mongoose.model<IConsultation>("Consultation", consultationSchema);


