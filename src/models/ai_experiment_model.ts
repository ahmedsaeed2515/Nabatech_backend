import { Schema, model, Types, Document } from "mongoose";

export interface IAiExperiment extends Document {
  name: string;
  description?: string;
  controlModel: Types.ObjectId;
  variantModel: Types.ObjectId;
  status: "running" | "completed" | "stopped";
  startDate: Date;
  endDate?: Date;
  metrics: {
    controlSuccess: number;
    variantSuccess: number;
    controlFailures: number;
    variantFailures: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const aiExperimentSchema = new Schema<IAiExperiment>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String },
    controlModel: { type: Schema.Types.ObjectId, ref: "AiModel", required: true },
    variantModel: { type: Schema.Types.ObjectId, ref: "AiModel", required: true },
    status: { type: String, enum: ["running", "completed", "stopped"], default: "running" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    metrics: {
      controlSuccess: { type: Number, default: 0 },
      variantSuccess: { type: Number, default: 0 },
      controlFailures: { type: Number, default: 0 },
      variantFailures: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export default model<IAiExperiment>("AiExperiment", aiExperimentSchema);
