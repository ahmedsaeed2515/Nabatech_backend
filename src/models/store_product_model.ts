import mongoose, { Document, Schema } from "mongoose";

export interface IStoreProduct extends Document {
  name: string;
  category: string;
  price: number;
  rating: number;
  subtitle: string;
  imageUrl: string;
  createdAt: Date;
  updatedAt: Date;
}

const storeProductSchema = new Schema<IStoreProduct>(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    rating: { type: Number, default: 5.0 },
    subtitle: { type: String, required: true },
    imageUrl: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<IStoreProduct>("StoreProduct", storeProductSchema);
