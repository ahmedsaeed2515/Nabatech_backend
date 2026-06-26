import mongoose, { Document, Schema } from "mongoose";

export interface IMyPlant extends Document {
  user: mongoose.Types.ObjectId;
  garden?: mongoose.Types.ObjectId;
  name: string;
  species: string;
  scientificName?: string;
  imageUrl: string;
  location: string;
  room?: string;
  notes?: string;
  waterFrequencyDays: number;
  lastWatered: Date;
  lastFertilized?: Date;
  plantLibraryId?: mongoose.Types.ObjectId;
  confidenceScore?: number;
  aiVerified?: boolean;
  userApproved?: boolean;
  enableNotifications: boolean;
  healthStatus: string;
  growthStage: 'SEED' | 'SPROUT' | 'VEGETATIVE' | 'FLOWERING' | 'FRUITING' | 'MATURE' | 'DEAD';
  createdAt: Date;
  updatedAt: Date;
}

const myPlantSchema = new Schema<IMyPlant>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    garden: { type: Schema.Types.ObjectId, ref: "Garden", index: true },
    name: { type: String, required: true },
    species: { type: String, required: true },
    scientificName: { type: String },
    imageUrl: { type: String, default: "" },
    location: { type: String, enum: ['indoor', 'outdoor', '\u062F\u0627\u062E\u0644\u064A', '\u062E\u0627\u0631\u062C\u064a'], required: true },
    room: { type: String },
    notes: { type: String },
    waterFrequencyDays: { type: Number, required: true },
    lastWatered: { type: Date, default: Date.now },
    lastFertilized: { type: Date },
    plantLibraryId: { type: Schema.Types.ObjectId, ref: "PlantLibrary" },
    confidenceScore: { type: Number },
    aiVerified: { type: Boolean, default: false },
    userApproved: { type: Boolean, default: false },
    enableNotifications: { type: Boolean, default: true },
    healthStatus: { 
      type: String, 
      enum: ['excellent', 'good', 'needs_care', 'sick', 'critical', 'ممتازة', 'جيدة', 'تحتاج رعاية', 'مريضة', 'حرجة'], 
      default: 'excellent' 
    },
    growthStage: {
      type: String,
      enum: ['SEED', 'SPROUT', 'VEGETATIVE', 'FLOWERING', 'FRUITING', 'MATURE', 'DEAD'],
      default: 'MATURE'
    },
  },
  { timestamps: true }
);

export default mongoose.model<IMyPlant>("MyPlant", myPlantSchema);


