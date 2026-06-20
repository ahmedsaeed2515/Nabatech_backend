import mongoose from "mongoose";
import dotenv from "dotenv";
import ExploreSection from "../models/explore_section_model";
import ExplorePlacement from "../models/explore_placement_model";
import { Article } from "../models/article_model";
import StoreProduct from "../models/store_product_model";

dotenv.config();

const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/nabatech";

async function seed() {
  try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB for explore seeding...");

    // 1. Seed Explore Sections
    await ExploreSection.deleteMany({});
    console.log("Cleared existing explore sections.");

    const sections = [
      { titleEn: "Latest Updates", titleAr: "آخر التحديثات", type: "banner", order: 0, isActive: true },
      { titleEn: "AI Recommendations for You", titleAr: "توصيات الذكاء الاصطناعي لك", type: "recommendations", order: 1, isActive: true },
      { titleEn: "Trending Content", titleAr: "المحتوى الرائج", type: "trending", order: 2, isActive: true },
      { titleEn: "Explore Products", titleAr: "استكشف المنتجات", type: "products", order: 3, isActive: true },
      { titleEn: "Consult Experts", titleAr: "استشر الخبراء", type: "experts", order: 4, isActive: true },
      { titleEn: "Disease Outbreaks Map", titleAr: "خريطة تفشي الأمراض", type: "outbreaks", order: 5, isActive: true }
    ];

    await ExploreSection.insertMany(sections);
    console.log("Seeded default explore sections successfully.");

    // 2. Create some sample Placements referencing articles/products if any
    await ExplorePlacement.deleteMany({});
    
    // Find some articles/products in DB to link
    const article = await Article.findOne();
    const product = await StoreProduct.findOne();

    if (article) {
      await ExplorePlacement.create({
        contentType: "article",
        contentId: article._id,
        section: "banner",
        title: "Mastering Tomato Plant Care",
        description: "An essential guide to pruning, watering, and feeding your tomato plants.",
        imageUrl: "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675",
        priority: 10,
        targetInterests: ["pest_control", "watering"],
        isActive: true,
        abGroup: "all"
      });
      console.log("Linked sample article placement.");
    }

    if (product) {
      await ExplorePlacement.create({
        contentType: "product",
        contentId: product._id,
        section: "featured",
        title: "Recommended Organic Soil",
        description: "Rich organic soil mix perfect for seed starter pots and vegetative growth.",
        imageUrl: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae",
        priority: 5,
        targetInterests: ["organic", "soil"],
        isActive: true,
        abGroup: "all"
      });
      console.log("Linked sample product placement.");
    }

    console.log("Explore Seeding completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  }
}

seed();
