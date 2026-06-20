import { Schema, model, Document } from "mongoose";

export interface IHomeQuickAction extends Document {
  actionId: string; // e.g., "scan", "ask_ai", "add_plant"
  label: string;
  iconName: string;
  deeplink: string;
  order: number;
  isActive: boolean;
}

const homeQuickActionSchema = new Schema<IHomeQuickAction>({
  actionId: { type: String, required: true, unique: true },
  label: { type: String, required: true },
  iconName: { type: String, required: true },
  deeplink: { type: String, required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default model<IHomeQuickAction>("HomeQuickAction", homeQuickActionSchema);
