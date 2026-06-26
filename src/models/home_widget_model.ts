import { Schema, model, Document } from "mongoose";

export interface IHomeWidget extends Document {
  widgetId: string; // e.g. "weather", "tasks", "plant_status"
  title: string;
  description: string;
  defaultOrder: number;
  isActive: boolean;
  minAppVersion?: string;
  targetRoles: string[]; // e.g. ["user", "premium"]
}

const homeWidgetSchema = new Schema<IHomeWidget>({
  widgetId: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  defaultOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
  minAppVersion: { type: String },
  targetRoles: { type: [String], default: ["user"] }
}, { timestamps: true });

export default model<IHomeWidget>("HomeWidget", homeWidgetSchema);


