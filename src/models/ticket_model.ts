import mongoose, { Document, Schema, Types } from "mongoose";

export enum TicketStatus {
  NEW = 'new',
  OPEN = 'open',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

export enum TicketPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum TicketCategory {
  TECHNICAL = 'technical',
  BILLING = 'billing',
  GENERAL = 'general',
  FEEDBACK = 'feedback'
}

export enum TicketSentiment {
  POSITIVE = 'positive',
  NEUTRAL = 'neutral',
  NEGATIVE = 'negative'
}

export interface ITicket extends Document {
  user?: Types.ObjectId;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedTo?: Types.ObjectId;
  category: TicketCategory;
  sentiment: TicketSentiment;
  tags: string[];
  attachments: Array<{ filename: string; url: string; contentType?: string }>;
  suggestedReply?: string;
  isDuplicate?: boolean;
  duplicateOf?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const ticketSchema = new Schema<ITicket>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: Object.values(TicketStatus),
      default: TicketStatus.NEW,
      index: true
    },
    priority: {
      type: String,
      enum: Object.values(TicketPriority),
      default: TicketPriority.MEDIUM,
      index: true
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
    category: {
      type: String,
      enum: Object.values(TicketCategory),
      default: TicketCategory.GENERAL,
      index: true
    },
    sentiment: {
      type: String,
      enum: Object.values(TicketSentiment),
      default: TicketSentiment.NEUTRAL,
      index: true
    },
    tags: [{ type: String }],
    attachments: [
      {
        filename: { type: String },
        url: { type: String },
        contentType: { type: String }
      }
    ],
    suggestedReply: { type: String },
    isDuplicate: { type: Boolean, default: false },
    duplicateOf: { type: Schema.Types.ObjectId, ref: "Ticket" },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

// Exclude soft-deleted records from basic queries
ticketSchema.pre(/^find/, function (next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<ITicket>("Ticket", ticketSchema);
