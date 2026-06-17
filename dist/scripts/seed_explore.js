"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const store_product_model_1 = __importDefault(require("../models/store_product_model"));
const expert_model_1 = __importDefault(require("../models/expert_model"));
const outbreak_spot_model_1 = __importDefault(require("../models/outbreak_spot_model"));
dotenv_1.default.config();
const connectDB = async () => {
    try {
        const conn = await mongoose_1.default.connect(process.env.MONGO_URI || "mongodb://localhost:27017/nabatech");
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};
const seedExplore = async () => {
    try {
        await connectDB();
        const productsCount = await store_product_model_1.default.countDocuments();
        if (productsCount === 0) {
            const seedProducts = [
                {
                    name: "NPK Organic Fertilizer",
                    category: "Nutrition",
                    price: 14.99,
                    rating: 4.8,
                    subtitle: "High-quality organic nitrogen-phosphorus-potassium mix.",
                    imageUrl: ""
                },
                {
                    name: "Pruning Shears",
                    category: "Tools",
                    price: 24.99,
                    rating: 4.6,
                    subtitle: "Sharp carbon steel blades with ergonomic non-slip handle.",
                    imageUrl: ""
                },
                {
                    name: "Premium Soil Mix",
                    category: "Nutrition",
                    price: 10.00,
                    rating: 4.7,
                    subtitle: "Rich, aerated organic potting mix for healthy roots.",
                    imageUrl: ""
                },
                {
                    name: "Neem Oil spray",
                    category: "Protection",
                    price: 12.40,
                    rating: 4.5,
                    subtitle: "100% cold-pressed organic leaf shine and insecticide.",
                    imageUrl: ""
                }
            ];
            await store_product_model_1.default.create(seedProducts);
            console.log("StoreProducts seeded successfully.");
        }
        const expertsCount = await expert_model_1.default.countDocuments();
        if (expertsCount === 0) {
            const seedExperts = [
                {
                    name: "Dr. Ahmed Mansour",
                    specialty: "Plant Pathology",
                    rating: 4.9,
                    sessions: 142,
                    fee: 50,
                    online: true,
                },
                {
                    name: "Eng. Mariam Salem",
                    specialty: "Hydroponics Specialist",
                    rating: 4.7,
                    sessions: 96,
                    fee: 40,
                    online: false,
                },
                {
                    name: "Dr. Khaled Fawzy",
                    specialty: "Soil Nutritionist",
                    rating: 4.8,
                    sessions: 115,
                    fee: 60,
                    online: true,
                }
            ];
            await expert_model_1.default.create(seedExperts);
            console.log("Experts seeded successfully.");
        }
        const spotsCount = await outbreak_spot_model_1.default.countDocuments();
        if (spotsCount === 0) {
            const seedSpots = [
                {
                    region: "Giza Region",
                    disease: "Late Blight",
                    severity: "high",
                    cases: 120,
                    trendPercent: 15,
                    mapX: 0.35,
                    mapY: 0.48,
                    colorHex: "#FF4D4D",
                },
                {
                    region: "Alexandria Region",
                    disease: "Powdery Mildew",
                    severity: "medium",
                    cases: 75,
                    trendPercent: -5,
                    mapX: 0.22,
                    mapY: 0.25,
                    colorHex: "#FFA502",
                },
                {
                    region: "Fayoum Region",
                    disease: "Spider Mites",
                    severity: "low",
                    cases: 40,
                    trendPercent: 2,
                    mapX: 0.45,
                    mapY: 0.65,
                    colorHex: "#2ED573",
                }
            ];
            await outbreak_spot_model_1.default.create(seedSpots);
            console.log("OutbreakSpots seeded successfully.");
        }
        console.log("Explore seeding completed!");
        process.exit(0);
    }
    catch (error) {
        console.error("Explore seeding failed:", error);
        process.exit(1);
    }
};
seedExplore();
