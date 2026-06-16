import { Schema, model, Types, Document } from "mongoose";

export interface IMessage extends Document {
  user: Types.ObjectId;
  sender: "user" | "llm"; // Legacy
  text: string;
  conversationId?: string;
  role?: "user" | "assistant" | "system";
  status?: "sent" | "failed";
  provider?: string;
  source?: string;
  sourceIds?: string[];
  requestId?: string;
  clientOperationId?: string;
  errorCode?: string;
  // Image chat fields
  imageUrl?: string;
  diagnosisResult?: {
    prediction: string;
    confidence: number;
    candidates?: Array<{ label: string; confidence?: number }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

const messageSchema = new Schema<IMessage>({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  sender: { type: String, enum: ["user", "llm"], required: true }, // Legacy
  text: { type: String, required: true },
  conversationId: { type: String, trim: true },
  role: { type: String, enum: ["user", "assistant", "system"] },
  status: { type: String, enum: ["sent", "failed"], default: "sent" },
  provider: { type: String, trim: true },
  source: { type: String, trim: true },
  sourceIds: { type: [String], default: [] },
  requestId: { type: String, trim: true },
  clientOperationId: { type: String, trim: true },
  errorCode: { type: String, trim: true },
  // Image chat fields — persists Cloudinary URL and CNN result
  imageUrl: { type: String, trim: true },
  diagnosisResult: {
    type: {
      prediction: { type: String },
      confidence: { type: Number },
      candidates: { type: [{ label: String, confidence: Number }], default: [] },
    },
    default: undefined,
  },
}, { timestamps: true });

messageSchema.index({ user: 1, createdAt: -1, _id: -1 });
messageSchema.index({ user: 1, conversationId: 1, createdAt: 1 });
messageSchema.index({ user: 1, conversationId: 1, createdAt: -1 }); // for history window queries
messageSchema.index(
  { user: 1, clientOperationId: 1 },
  { unique: true, partialFilterExpression: { clientOperationId: { $exists: true, $type: "string" } } }
);

export default model<IMessage>("Message", messageSchema);