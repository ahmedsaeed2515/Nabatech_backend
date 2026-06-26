import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITicketHistory extends Document {
  ticket: Types.ObjectId;
  user: Types.ObjectId;
  action: string;
  details: string;
  createdAt: Date;
}

const ticketHistorySchema = new Schema<ITicketHistory>(
  {
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    action: { type: String, required: true },
    details: { type: String, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

export default mongoose.model<ITicketHistory>("TicketHistory", ticketHistorySchema);


