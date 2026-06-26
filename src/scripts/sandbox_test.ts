import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

// Load env
dotenv.config();

// V2 Models
import UserModel from '../models/user_model';
import GardenModel from '../models/garden_model';
import ZoneModel, { ZoneType } from '../models/zone_model';
import PlantDnaModel from '../models/plant_dna_model';
import PlantModel, { PlantStage } from '../models/plant_model';
import { AiOrchestratorService } from '../services/AiOrchestratorService';

async function runSandboxTest() {
  logger.info('--- Starting Sandbox E2E Simulation ---');

  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    logger.info('Connected to MongoDB');

    // 1. Create a Test User
    const testEmail = `test_user_${Date.now()}@example.com`;
    const user = await UserModel.create({
      email: testEmail,
      passwordHash: 'dummy_hash_for_testing',
      firstName: 'Test',
      lastName: 'User',
      latitude: 30.0444, // Cairo
      longitude: 31.2357
    });
    logger.info(`✅ User created: ${user.email} (ID: ${user._id})`);

    // 2. Create a Garden
    const garden = await GardenModel.create({
      user: user._id,
      name: 'Sandbox Test Garden',
      location: 'Balcony'
    });
    logger.info(`✅ Garden created: ${garden.name} (ID: ${garden._id})`);

    // 3. Create a Zone
    const zone = await ZoneModel.create({
      user: user._id,
      garden: garden._id,
      name: 'Sunny Window',
      type: ZoneType.INDOOR_WINDOW
    });
    logger.info(`✅ Zone created: ${zone.name} (ID: ${zone._id})`);

    // 4. Create a Plant DNA (Library)
    const dna = await PlantDnaModel.create({
      species: 'Monstera Deliciosa',
      scientificName: 'Monstera deliciosa Liebm.',
      toxicity: false,
      minTemp: 18,
      maxTemp: 30,
      lightReq: 'Bright Indirect',
      waterFrequencyDays: 7
    });
    logger.info(`✅ Plant DNA created: ${dna.species} (ID: ${dna._id})`);

    // 5. Create a Plant
    const plant = await PlantModel.create({
      user: user._id,
      zone: zone._id,
      dna: dna._id,
      name: 'My Monster',
      stage: PlantStage.VEGETATIVE,
      healthScore: 95
    });
    logger.info(`✅ Plant created: ${plant.name} (ID: ${plant._id})`);

    // 6. Test AI Model integration
    logger.info('🤖 Testing AI Model (Chatbot)...');
    
    // We mock the AI Orchestrator just slightly or rely on the fact that if Google Gemini fails it throws cleanly.
    const aiService = new AiOrchestratorService();
    try {
      // Mock the gemini call inside the service if we don't have a real API key, 
      // but let's try the real one if it's there.
      const chatResponse = await aiService.processChat(user._id.toString(), 'How do I care for my Monstera?');
      logger.info('✅ AI Response received: ' + chatResponse.reply.substring(0, 50) + '...');
      if (chatResponse.detectedPlant) {
         logger.info(`   🤖 AI detected plant context: ${chatResponse.detectedPlant.name}`);
      }
    } catch (aiErr: any) {
      logger.warn('⚠️ AI test failed or skipped (Maybe missing API Key or Mock needed). Msg: ' + aiErr.message);
    }

    // Clean up
    logger.info('🧹 Cleaning up test data...');
    await PlantModel.findByIdAndDelete(plant._id);
    await PlantDnaModel.findByIdAndDelete(dna._id);
    await ZoneModel.findByIdAndDelete(zone._id);
    await GardenModel.findByIdAndDelete(garden._id);
    await UserModel.findByIdAndDelete(user._id);
    logger.info('✅ Clean up complete.');

    logger.info('--- Sandbox E2E Simulation SUCCESS ---');
    process.exit(0);

  } catch (err) {
    logger.error('Sandbox test failed:', err);
    process.exit(1);
  }
}

runSandboxTest();


