import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load env
dotenv.config();

// V2 Models
import UserModel, { UserLevel, UserRole } from '../models/user_model';
import GardenModel from '../models/garden_model';
import ZoneModel, { ZoneType } from '../models/zone_model';
import PlantDnaModel from '../models/plant_dna_model';
import PlantModel, { PlantStage } from '../models/plant_model';
import CareActionModel, { CareActionType } from '../models/care_action_model';
import WishlistItemModel from '../models/wishlist_item_model';
import InventoryItemModel from '../models/inventory_item_model';
import UserXpModel from '../models/user_xp_model';
import AchievementModel from '../models/achievement_model';
import StreakModel from '../models/streak_model';
import CommunityPostModel from '../models/community_post_model';
import TaskModel, { TaskStatus } from '../models/task_model';

import { AiOrchestratorService } from '../services/AiOrchestratorService';

async function seedUser() {
  logger.info('--- Starting Full Database Seeding for ahmedsaeed@gmail.com ---');

  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info('Connected to MongoDB');

    // Drop legacy V1 indexes that cause conflicts
    try {
      await mongoose.connection.db?.collection('plants').dropIndex('slug_1');
      logger.info('Dropped legacy slug_1 index from plants collection.');
    } catch (e) {
      // Ignore if it doesn't exist
    }

    const email = 'ahmedsaeed@gmail.com';
    const password = 'ahmed123';

    // 1. Clean up existing data for this user
    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      logger.info('Deleting existing user and associated data...');
      await GardenModel.deleteMany({ user: existingUser._id });
      await ZoneModel.deleteMany({ user: existingUser._id });
      await PlantModel.deleteMany({ user: existingUser._id });
      await CareActionModel.deleteMany({ user: existingUser._id });
      await WishlistItemModel.deleteMany({ user: existingUser._id });
      await InventoryItemModel.deleteMany({ user: existingUser._id });
      await UserXpModel.deleteMany({ user: existingUser._id });
      await StreakModel.deleteMany({ user: existingUser._id });
      await CommunityPostModel.deleteMany({ author: existingUser._id });
      await TaskModel.deleteMany({ user: existingUser._id });
      await UserModel.findByIdAndDelete(existingUser._id);
    }

    // 2. Create User
    const hashed = await bcrypt.hash(password, 10);
    const user = await UserModel.create({
      email,
      passwordHash: hashed,
      firstName: 'Ahmed',
      lastName: 'Saeed',
      role: UserRole.USER,
      level: UserLevel.SPROUT,
      latitude: 30.0444, // Cairo
      longitude: 31.2357
    });
    logger.info(`✅ User created: ${user.email} (ID: ${user._id})`);

    // 3. Create Garden
    const garden = await GardenModel.create({
      user: user._id,
      name: 'Ahmed Oasis',
      location: 'Balcony & Indoor'
    });
    logger.info(`✅ Garden created: ${garden.name}`);

    // 4. Create Zones
    const indoorZone = await ZoneModel.create({
      user: user._id,
      garden: garden._id,
      name: 'Living Room Corner',
      type: ZoneType.INDOOR_WINDOW
    });
    const outdoorZone = await ZoneModel.create({
      user: user._id,
      garden: garden._id,
      name: 'Sunny Balcony',
      type: ZoneType.FULL_SUN
    });
    logger.info(`✅ Zones created: ${indoorZone.name}, ${outdoorZone.name}`);

    // 5. Create Plant DNA
    const dna1 = await PlantDnaModel.create({
      species: 'Ficus elastica ' + Date.now(),
      scientificName: 'Ficus elastica',
      toxicity: true,
      minTemp: 15,
      maxTemp: 29,
      lightReq: 'Bright Indirect',
      waterFrequencyDays: 10
    });
    const dna2 = await PlantDnaModel.create({
      species: 'Rosa rubiginosa ' + Date.now(),
      scientificName: 'Rosa rubiginosa',
      toxicity: false,
      minTemp: -5,
      maxTemp: 35,
      lightReq: 'Full Sun',
      waterFrequencyDays: 3
    });

    // 6. Create Plants
    const plant1 = await PlantModel.create({
      user: user._id,
      zone: indoorZone._id,
      dna: dna1._id,
      name: 'My Rubber Plant',
      stage: PlantStage.VEGETATIVE,
      healthScore: 90,
      imageUrl: 'https://res.cloudinary.com/nabatech/image/upload/v12345/rubber_plant.jpg'
    });
    const plant2 = await PlantModel.create({
      user: user._id,
      zone: outdoorZone._id,
      dna: dna2._id,
      name: 'Balcony Rose',
      stage: PlantStage.FLOWERING,
      healthScore: 100,
      imageUrl: 'https://res.cloudinary.com/nabatech/image/upload/v12345/rose_plant.jpg'
    });
    logger.info(`✅ Plants created: ${plant1.name}, ${plant2.name}`);

    // 7. Create Care Actions
    await CareActionModel.create({
      user: user._id,
      plant: plant1._id,
      type: CareActionType.WATER,
      date: new Date(),
      notes: 'Watered 500ml'
    });
    await CareActionModel.create({
      user: user._id,
      plant: plant2._id,
      type: CareActionType.FERTILIZER,
      date: new Date(),
      notes: 'Used NPK 20-20-20'
    });
    logger.info(`✅ Care Actions added.`);

    // 8. Create Gamification Stats
    await UserXpModel.create({ user: user._id, totalXp: 1250 });
    await StreakModel.create({ user: user._id, current: 5, longest: 12, lastActive: new Date() });
    
    // Create an achievement explicitly
    const seedAchievement = await AchievementModel.findOne({ name: 'First Plant' });
    if (!seedAchievement) {
      await AchievementModel.create({ name: 'First Plant', description: 'Added your first plant!', icon: '🌱' });
    }
    logger.info(`✅ Gamification XP (1250) and Streak (5) added.`);

    // 9. Create Community Post
    await CommunityPostModel.create({
      author: user._id,
      authorName: 'Ahmed Saeed',
      title: 'My First Rose!',
      content: 'Hello Nabatech Community! Just joined and added my first Rose! 🌹',
      plantTag: 'General',
      images: ['https://res.cloudinary.com/nabatech/image/upload/v12345/rose_plant.jpg'],
      likesCount: 5,
      commentsCount: 0
    });
    logger.info(`✅ Community Post created.`);

    // 10. Create Tooling (Inventory & Wishlist)
    await InventoryItemModel.create({
      user: user._id,
      name: 'Organic Compost 5kg',
      type: 'FERTILIZER',
      quantity: 1,
      notes: 'Keep dry'
    });
    await WishlistItemModel.create({
      user: user._id,
      species: 'Monstera Albo',
      notes: 'Wait for a discount'
    });
    logger.info(`✅ Inventory and Wishlist items added.`);

    // 11. Create Task
    await TaskModel.create({
      user: user._id,
      plant: plant1._id,
      title: 'Water the Rubber Plant',
      dueDate: new Date(Date.now() + 86400000 * 2), // Due in 2 days
      status: TaskStatus.PENDING
    });
    logger.info(`✅ Task created.`);

    // 12. Test AI Engine Integrations
    logger.info('🤖 Checking AI Orchestrator connectivity...');
    const aiService = new AiOrchestratorService();
    try {
      const chatResponse = await aiService.processChat(user._id.toString(), 'I just watered my plants! Do you have any general advice for a new gardener?');
      logger.info('✅ AI Response received: ' + chatResponse.reply.substring(0, 100) + '...');
    } catch (aiErr: any) {
      logger.warn('⚠️ AI integration hit a barrier (possibly missing GEMINI_API_KEY). Msg: ' + aiErr.message);
    }

    logger.info('--- SEEDING COMPLETED SUCCESSFULLY ---');
    logger.info('You can now log in with:');
    logger.info('Email: ahmedsaeed@gmail.com');
    logger.info('Password: ahmed123');
    process.exit(0);

  } catch (err) {
    logger.error('Seeding test failed:', err);
    process.exit(1);
  }
}

seedUser();


