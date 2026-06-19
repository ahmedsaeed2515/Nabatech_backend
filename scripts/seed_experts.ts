import mongoose from "mongoose";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import User from "../src/models/user_model";
import ExpertProfile from "../src/models/expert_profile_model";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

const expertsData = [
  {
    name: "د. أحمد منصور",
    email: "ahmed.mansour.expert@nabatech.com",
    avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=500&q=80",
    specialization: "Plant Pathology",
    bio: "خبير معتمد في أمراض النباتات ومكافحة الآفات بخبرة تزيد عن 15 عاماً.",
    yearsExperience: 15,
  },
  {
    name: "م. سارة جمال",
    email: "sara.gamal.expert@nabatech.com",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=500&q=80",
    specialization: "Indoor Plants",
    bio: "مهندسة زراعية متخصصة في نباتات الزينة الداخلية وكيفية العناية بها في مختلف الظروف.",
    yearsExperience: 8,
  },
  {
    name: "م. طارق العلي",
    email: "tarek.alali.expert@nabatech.com",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&q=80",
    specialization: "Agriculture",
    bio: "متخصص في الزراعة العضوية وتطوير المحاصيل وإنتاج الأسمدة الطبيعية.",
    yearsExperience: 12,
  },
  {
    name: "د. ليلى فؤاد",
    email: "laila.fouad.expert@nabatech.com",
    avatarUrl: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=500&q=80",
    specialization: "Botany",
    bio: "باحثة في علم النباتات، مهتمة بتطوير طرق ري حديثة ومستدامة للنباتات المنزلية.",
    yearsExperience: 10,
  },
  {
    name: "م. خالد حسن",
    email: "khaled.hassan.expert@nabatech.com",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=500&q=80",
    specialization: "Landscaping",
    bio: "خبير في تنسيق الحدائق الخارجية واختيار النباتات المناسبة لمختلف الأجواء.",
    yearsExperience: 20,
  }
];

const seedExperts = async () => {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI is missing");
    console.log("Connecting to", MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    for (const expert of expertsData) {
      // Create User
      let user = await User.findOne({ email: expert.email });
      if (!user) {
        user = await User.create({
          name: expert.name,
          email: expert.email,
          passwordHash: await bcrypt.hash("password123", 10),
          role: "expert",
          avatarUrl: expert.avatarUrl,
        });
        console.log(`Created expert user: ${expert.name}`);
      } else {
        console.log(`Expert user already exists: ${expert.name}`);
      }

      // Create Profile
      let profile = await ExpertProfile.findOne({ userId: user._id });
      if (!profile) {
        await ExpertProfile.create({
          userId: user._id,
          bio: expert.bio,
          specialization: expert.specialization,
          yearsExperience: expert.yearsExperience,
          expertPostsCount: Math.floor(Math.random() * 20) + 5,
          expertRepliesCount: Math.floor(Math.random() * 50) + 10,
        });
        console.log(`Created expert profile for: ${expert.name}`);
      } else {
        console.log(`Expert profile already exists for: ${expert.name}`);
      }
    }
    
    console.log("Seeding experts complete!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding experts:", error);
    process.exit(1);
  }
};

seedExperts();
