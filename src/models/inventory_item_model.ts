import mongoose, { Schema, Document, Types } from 'mongoose';

export enum InventoryItemType {
  POT = 'POT',
  TOOL = 'TOOL',
  FERTILIZER = 'FERTILIZER'
}

export interface InventoryItem extends Document {
  user: Types.ObjectId;
  type: InventoryItemType;
  name: string;
  qty: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

const inventoryItemSchema = new Schema<InventoryItem>({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: Object.values(InventoryItemType), required: true },
  name: { type: String, required: true },
  qty: { type: Number, required: true, default: 1 },
  deletedAt: { type: Date, default: null }
}, { timestamps: true });

inventoryItemSchema.pre(/^find/, function(next) {
  const query = this as mongoose.Query<any, any>;
  query.find({ deletedAt: { $eq: null } });
  next();
});

export default mongoose.model<InventoryItem>('InventoryItem', inventoryItemSchema);


