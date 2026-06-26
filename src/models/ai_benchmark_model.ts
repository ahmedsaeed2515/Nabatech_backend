import { Schema, model, Types, Document } from "mongoose";

export interface IAiBenchmark {
  model: Types.ObjectId;
  testSuite: string;
  averageLatencyMs: number;
  successRate: number; // 0 to 1
  tokensPerSecond: number;
  testedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const aiBenchmarkSchema = new Schema<IAiBenchmark>(
  {
    model: { type: Schema.Types.ObjectId, ref: "AiModel", required: true },
    testSuite: { type: String, required: true },
    averageLatencyMs: { type: Number, required: true },
    successRate: { type: Number, required: true, min: 0, max: 1 },
    tokensPerSecond: { type: Number, required: true },
    testedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

aiBenchmarkSchema.index({ model: 1, testedAt: -1 });

export default model<IAiBenchmark>("AiBenchmark", aiBenchmarkSchema);


