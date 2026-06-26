import mongoose, { Document, Schema } from "mongoose";

export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
}

export interface ICart extends Document {
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  updatedAt: Date;
  createdAt: Date;
}

const cartItemSchema = new Schema<ICartItem>({
  product: { type: Schema.Types.ObjectId, ref: "StoreProduct", required: true },
  quantity: { type: Number, required: true, default: 1 },
}, { _id: false });

const cartSchema = new Schema<ICart>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true }
);

export default mongoose.model<ICart>("Cart", cartSchema);


