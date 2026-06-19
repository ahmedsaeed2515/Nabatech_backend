import mongoose from "mongoose";
import dotenv from "dotenv";
import MyPlant from "../src/models/my_plant_model";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const USER_ID = "6a34bc5a27f1ee0a94b8f6d9";

const myPlants = [
  {
    user: USER_ID,
    name: "نبتة المطاط الخاصة بي",
    species: "Rubber Plant",
    imageUrl: "https://images.unsplash.com/photo-1600411832986-5a4477b64a1c?w=500&q=80",
    location: "indoor",
    waterFrequencyDays: 7,
    healthStatus: "excellent"
  },
  {
    user: USER_ID,
    name: "البوتس الجميل",
    species: "Pothos",
    imageUrl: "https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=500&q=80",
    location: "indoor",
    waterFrequencyDays: 5,
    healthStatus: "good"
  },
  {
    user: USER_ID,
    name: "المونستيرا",
    species: "Monstera Deliciosa",
    imageUrl: "https://images.unsplash.com/photo-1614594895304-fe7116ac3b58?w=500&q=80",
    location: "indoor",
    waterFrequencyDays: 10,
    healthStatus: "excellent"
  },
  {
    user: USER_ID,
    name: "زنبق السلام في غرفتي",
    species: "Peace Lily",
    imageUrl: "https://images.unsplash.com/photo-1593696954577-ab3d39317b97?w=500&q=80",
    location: "indoor",
    waterFrequencyDays: 4,
    healthStatus: "needs_care"
  }
];

const seedMyPlants = async () => {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI is missing");
    console.log("Connecting to", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    // Optional: clear existing plants for this user if needed, but let's just add them
    for (const p of myPlants) {
      await MyPlant.create(p);
      console.log(`Added MyPlant: ${p.name}`);
    }
    
    console.log("Seeding my plants complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding my plants DB:", error);
    process.exit(1);
  }
};

seedMyPlants();
