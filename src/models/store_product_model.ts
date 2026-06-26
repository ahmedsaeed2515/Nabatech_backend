import mongoose, { Document, Schema } from "mongoose";

export interface IStoreProduct extends Document {
  name: string;
  description: string;
  category: string;
  price: number;
  salePrice?: number;
  currency: string;
  rating: number;
  reviewsCount: number;
  subtitle: string;
  imageUrl: string;
  galleryImages: string[];
  stock: number;
  sku: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isActive: boolean;
  features: string[];
  specifications: Record<string, string>;
  howToUse: string[];
  compatiblePlants: string[];
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const storeProductSchema = new Schema<IStoreProduct>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    salePrice: { type: Number },
    currency: { type: String, default: "USD" },
    rating: { type: Number, default: 5.0 },
    reviewsCount: { type: Number, default: 0 },
    subtitle: { type: String, default: "" },
    imageUrl: { type: String, default: "" },
    galleryImages: { type: [String], default: [] },
    stock: { type: Number, default: 0 },
    sku: { type: String, default: "" },
    isFeatured: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    features: { type: [String], default: [] },
    specifications: { type: Map, of: String, default: {} },
    howToUse: { type: [String], default: [] },
    compatiblePlants: { type: [String], default: [] },
    deletedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model<IStoreProduct>("StoreProduct", storeProductSchema);


