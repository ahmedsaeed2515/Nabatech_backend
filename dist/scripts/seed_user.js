"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
// Load env
dotenv_1.default.config();
// V2 Models
const user_model_1 = __importStar(require("../models/user_model"));
const garden_model_1 = __importDefault(require("../models/garden_model"));
const zone_model_1 = __importStar(require("../models/zone_model"));
const plant_dna_model_1 = __importDefault(require("../models/plant_dna_model"));
const plant_model_1 = __importStar(require("../models/plant_model"));
const care_action_model_1 = __importStar(require("../models/care_action_model"));
const wishlist_item_model_1 = __importDefault(require("../models/wishlist_item_model"));
const inventory_item_model_1 = __importDefault(require("../models/inventory_item_model"));
const user_xp_model_1 = __importDefault(require("../models/user_xp_model"));
const achievement_model_1 = __importDefault(require("../models/achievement_model"));
const streak_model_1 = __importDefault(require("../models/streak_model"));
const community_post_model_1 = __importDefault(require("../models/community_post_model"));
const task_model_1 = __importStar(require("../models/task_model"));
const AiOrchestratorService_1 = require("../services/AiOrchestratorService");
async function seedUser() {
    logger_1.logger.info('--- Starting Full Database Seeding for ahmedsaeed@gmail.com ---');
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        logger_1.logger.info('Connected to MongoDB');
        // Drop legacy V1 indexes that cause conflicts
        try {
            await mongoose_1.default.connection.db?.collection('plants').dropIndex('slug_1');
            logger_1.logger.info('Dropped legacy slug_1 index from plants collection.');
        }
        catch (e) {
            // Ignore if it doesn't exist
        }
        const email = 'ahmedsaeed@gmail.com';
        const password = 'ahmed123';
        // 1. Clean up existing data for this user
        const existingUser = await user_model_1.default.findOne({ email });
        if (existingUser) {
            logger_1.logger.info('Deleting existing user and associated data...');
            await garden_model_1.default.deleteMany({ user: existingUser._id });
            await zone_model_1.default.deleteMany({ user: existingUser._id });
            await plant_model_1.default.deleteMany({ user: existingUser._id });
            await care_action_model_1.default.deleteMany({ user: existingUser._id });
            await wishlist_item_model_1.default.deleteMany({ user: existingUser._id });
            await inventory_item_model_1.default.deleteMany({ user: existingUser._id });
            await user_xp_model_1.default.deleteMany({ user: existingUser._id });
            await streak_model_1.default.deleteMany({ user: existingUser._id });
            await community_post_model_1.default.deleteMany({ author: existingUser._id });
            await task_model_1.default.deleteMany({ user: existingUser._id });
            await user_model_1.default.findByIdAndDelete(existingUser._id);
        }
        // 2. Create User
        const hashed = await bcrypt_1.default.hash(password, 10);
        const user = await user_model_1.default.create({
            email,
            passwordHash: hashed,
            firstName: 'Ahmed',
            lastName: 'Saeed',
            role: user_model_1.UserRole.USER,
            level: user_model_1.UserLevel.SPROUT,
            latitude: 30.0444, // Cairo
            longitude: 31.2357
        });
        logger_1.logger.info(`✅ User created: ${user.email} (ID: ${user._id})`);
        // 3. Create Garden
        const garden = await garden_model_1.default.create({
            user: user._id,
            name: 'Ahmed Oasis',
            location: 'Balcony & Indoor'
        });
        logger_1.logger.info(`✅ Garden created: ${garden.name}`);
        // 4. Create Zones
        const indoorZone = await zone_model_1.default.create({
            user: user._id,
            garden: garden._id,
            name: 'Living Room Corner',
            type: zone_model_1.ZoneType.INDOOR_WINDOW
        });
        const outdoorZone = await zone_model_1.default.create({
            user: user._id,
            garden: garden._id,
            name: 'Sunny Balcony',
            type: zone_model_1.ZoneType.FULL_SUN
        });
        logger_1.logger.info(`✅ Zones created: ${indoorZone.name}, ${outdoorZone.name}`);
        // 5. Create Plant DNA
        const dna1 = await plant_dna_model_1.default.create({
            species: 'Ficus elastica ' + Date.now(),
            scientificName: 'Ficus elastica',
            toxicity: true,
            minTemp: 15,
            maxTemp: 29,
            lightReq: 'Bright Indirect',
            waterFrequencyDays: 10
        });
        const dna2 = await plant_dna_model_1.default.create({
            species: 'Rosa rubiginosa ' + Date.now(),
            scientificName: 'Rosa rubiginosa',
            toxicity: false,
            minTemp: -5,
            maxTemp: 35,
            lightReq: 'Full Sun',
            waterFrequencyDays: 3
        });
        // 6. Create Plants
        const plant1 = await plant_model_1.default.create({
            user: user._id,
            zone: indoorZone._id,
            dna: dna1._id,
            name: 'My Rubber Plant',
            stage: plant_model_1.PlantStage.VEGETATIVE,
            healthScore: 90,
            imageUrl: 'https://res.cloudinary.com/nabatech/image/upload/v12345/rubber_plant.jpg'
        });
        const plant2 = await plant_model_1.default.create({
            user: user._id,
            zone: outdoorZone._id,
            dna: dna2._id,
            name: 'Balcony Rose',
            stage: plant_model_1.PlantStage.FLOWERING,
            healthScore: 100,
            imageUrl: 'https://res.cloudinary.com/nabatech/image/upload/v12345/rose_plant.jpg'
        });
        logger_1.logger.info(`✅ Plants created: ${plant1.name}, ${plant2.name}`);
        // 7. Create Care Actions
        await care_action_model_1.default.create({
            user: user._id,
            plant: plant1._id,
            type: care_action_model_1.CareActionType.WATER,
            date: new Date(),
            notes: 'Watered 500ml'
        });
        await care_action_model_1.default.create({
            user: user._id,
            plant: plant2._id,
            type: care_action_model_1.CareActionType.FERTILIZER,
            date: new Date(),
            notes: 'Used NPK 20-20-20'
        });
        logger_1.logger.info(`✅ Care Actions added.`);
        // 8. Create Gamification Stats
        await user_xp_model_1.default.create({ user: user._id, totalXp: 1250 });
        await streak_model_1.default.create({ user: user._id, current: 5, longest: 12, lastActive: new Date() });
        // Create an achievement explicitly
        const seedAchievement = await achievement_model_1.default.findOne({ name: 'First Plant' });
        if (!seedAchievement) {
            await achievement_model_1.default.create({ name: 'First Plant', description: 'Added your first plant!', icon: '🌱' });
        }
        logger_1.logger.info(`✅ Gamification XP (1250) and Streak (5) added.`);
        // 9. Create Community Post
        await community_post_model_1.default.create({
            author: user._id,
            authorName: 'Ahmed Saeed',
            title: 'My First Rose!',
            content: 'Hello Nabatech Community! Just joined and added my first Rose! 🌹',
            plantTag: 'General',
            images: ['https://res.cloudinary.com/nabatech/image/upload/v12345/rose_plant.jpg'],
            likesCount: 5,
            commentsCount: 0
        });
        logger_1.logger.info(`✅ Community Post created.`);
        // 10. Create Tooling (Inventory & Wishlist)
        await inventory_item_model_1.default.create({
            user: user._id,
            name: 'Organic Compost 5kg',
            type: 'FERTILIZER',
            quantity: 1,
            notes: 'Keep dry'
        });
        await wishlist_item_model_1.default.create({
            user: user._id,
            species: 'Monstera Albo',
            notes: 'Wait for a discount'
        });
        logger_1.logger.info(`✅ Inventory and Wishlist items added.`);
        // 11. Create Task
        await task_model_1.default.create({
            user: user._id,
            plant: plant1._id,
            title: 'Water the Rubber Plant',
            dueDate: new Date(Date.now() + 86400000 * 2), // Due in 2 days
            status: task_model_1.TaskStatus.PENDING
        });
        logger_1.logger.info(`✅ Task created.`);
        // 12. Test AI Engine Integrations
        logger_1.logger.info('🤖 Checking AI Orchestrator connectivity...');
        const aiService = new AiOrchestratorService_1.AiOrchestratorService();
        try {
            const chatResponse = await aiService.processChat(user._id.toString(), 'I just watered my plants! Do you have any general advice for a new gardener?');
            logger_1.logger.info('✅ AI Response received: ' + chatResponse.reply.substring(0, 100) + '...');
        }
        catch (aiErr) {
            logger_1.logger.warn('⚠️ AI integration hit a barrier (possibly missing GEMINI_API_KEY). Msg: ' + aiErr.message);
        }
        logger_1.logger.info('--- SEEDING COMPLETED SUCCESSFULLY ---');
        logger_1.logger.info('You can now log in with:');
        logger_1.logger.info('Email: ahmedsaeed@gmail.com');
        logger_1.logger.info('Password: ahmed123');
        process.exit(0);
    }
    catch (err) {
        logger_1.logger.error('Seeding test failed:', err);
        process.exit(1);
    }
}
seedUser();
