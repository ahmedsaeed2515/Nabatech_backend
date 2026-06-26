import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITicketReply extends Document {
  ticket: Types.ObjectId;
  sender: Types.ObjectId;
  message: string;
  isInternalNote: boolean;
  attachments: Array<{ filename: string; url: string; contentType?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const ticketReplySchema = new Schema<ITicketReply>(
  {
    ticket: { type: Schema.Types.ObjectId, ref: "Ticket", required: true, index: true },
    sender: { type: Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    isInternalNote: { type: Boolean, default: false },
    attachments: [
      {
        filename: { type: String },
        url: { type: String },
        contentType: { type: String }
      }
    ]
  },
  { timestamps: true }
);

export default mongoose.model<ITicketReply>("TicketReply", ticketReplySchema);


