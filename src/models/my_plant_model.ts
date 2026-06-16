import mongoose, { Document, Schema } from "mongoose";

export interface IMyPlant extends Document {
  user: mongoose.Types.ObjectId;
  name: string;
  species: string;
  imageUrl: string;
  location: string;
  waterFrequencyDays: number;
  lastWatered: Date;
  plantLibraryId?: mongoose.Types.ObjectId;
  enableNotifications: boolean;
  healthStatus: string;
  createdAt: Date;
  updatedAt: Date;
}

const myPlantSchema = new Schema<IMyPlant>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true },
    species: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    location: { type: String, enum: ['indoor', 'outdoor', '\u062F\u0627\u062E\u0644\u064A', '\u062E\u0627\u0631\u062C\u064A'], required: true },
    waterFrequencyDays: { type: Number, required: true },
    lastWatered: { type: Date, default: Date.now },
    plantLibraryId: { type: Schema.Types.ObjectId, ref: "PlantLibrary" },
    enableNotifications: { type: Boolean, default: true },
    healthStatus: { 
      type: String, 
      enum: ['excellent', 'good', 'needs_care', 'sick', 'critical', 'ممتازة', 'جيدة', 'تحتاج رعاية', 'مريضة', 'حرجة'], 
      default: 'excellent' 
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMyPlant>("MyPlant", myPlantSchema);
