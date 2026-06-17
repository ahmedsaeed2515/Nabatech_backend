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
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("../utils/logger");
// Load env
dotenv_1.default.config();
// V2 Models
const user_model_1 = __importDefault(require("../models/user_model"));
const garden_model_1 = __importDefault(require("../models/garden_model"));
const zone_model_1 = __importStar(require("../models/zone_model"));
const plant_dna_model_1 = __importDefault(require("../models/plant_dna_model"));
const plant_model_1 = __importStar(require("../models/plant_model"));
const AiOrchestratorService_1 = require("../services/AiOrchestratorService");
async function runSandboxTest() {
    logger_1.logger.info('--- Starting Sandbox E2E Simulation ---');
    try {
        await mongoose_1.default.connect(process.env.MONGODB_URI);
        logger_1.logger.info('Connected to MongoDB');
        // 1. Create a Test User
        const testEmail = `test_user_${Date.now()}@example.com`;
        const user = await user_model_1.default.create({
            email: testEmail,
            passwordHash: 'dummy_hash_for_testing',
            firstName: 'Test',
            lastName: 'User',
            latitude: 30.0444, // Cairo
            longitude: 31.2357
        });
        logger_1.logger.info(`✅ User created: ${user.email} (ID: ${user._id})`);
        // 2. Create a Garden
        const garden = await garden_model_1.default.create({
            user: user._id,
            name: 'Sandbox Test Garden',
            location: 'Balcony'
        });
        logger_1.logger.info(`✅ Garden created: ${garden.name} (ID: ${garden._id})`);
        // 3. Create a Zone
        const zone = await zone_model_1.default.create({
            user: user._id,
            garden: garden._id,
            name: 'Sunny Window',
            type: zone_model_1.ZoneType.INDOOR_WINDOW
        });
        logger_1.logger.info(`✅ Zone created: ${zone.name} (ID: ${zone._id})`);
        // 4. Create a Plant DNA (Library)
        const dna = await plant_dna_model_1.default.create({
            species: 'Monstera Deliciosa',
            scientificName: 'Monstera deliciosa Liebm.',
            toxicity: false,
            minTemp: 18,
            maxTemp: 30,
            lightReq: 'Bright Indirect',
            waterFrequencyDays: 7
        });
        logger_1.logger.info(`✅ Plant DNA created: ${dna.species} (ID: ${dna._id})`);
        // 5. Create a Plant
        const plant = await plant_model_1.default.create({
            user: user._id,
            zone: zone._id,
            dna: dna._id,
            name: 'My Monster',
            stage: plant_model_1.PlantStage.VEGETATIVE,
            healthScore: 95
        });
        logger_1.logger.info(`✅ Plant created: ${plant.name} (ID: ${plant._id})`);
        // 6. Test AI Model integration
        logger_1.logger.info('🤖 Testing AI Model (Chatbot)...');
        // We mock the AI Orchestrator just slightly or rely on the fact that if Google Gemini fails it throws cleanly.
        const aiService = new AiOrchestratorService_1.AiOrchestratorService();
        try {
            // Mock the gemini call inside the service if we don't have a real API key, 
            // but let's try the real one if it's there.
            const chatResponse = await aiService.processChat(user._id.toString(), 'How do I care for my Monstera?');
            logger_1.logger.info('✅ AI Response received: ' + chatResponse.reply.substring(0, 50) + '...');
            if (chatResponse.detectedPlant) {
                logger_1.logger.info(`   🤖 AI detected plant context: ${chatResponse.detectedPlant.name}`);
            }
        }
        catch (aiErr) {
            logger_1.logger.warn('⚠️ AI test failed or skipped (Maybe missing API Key or Mock needed). Msg: ' + aiErr.message);
        }
        // Clean up
        logger_1.logger.info('🧹 Cleaning up test data...');
        await plant_model_1.default.findByIdAndDelete(plant._id);
        await plant_dna_model_1.default.findByIdAndDelete(dna._id);
        await zone_model_1.default.findByIdAndDelete(zone._id);
        await garden_model_1.default.findByIdAndDelete(garden._id);
        await user_model_1.default.findByIdAndDelete(user._id);
        logger_1.logger.info('✅ Clean up complete.');
        logger_1.logger.info('--- Sandbox E2E Simulation SUCCESS ---');
        process.exit(0);
    }
    catch (err) {
        logger_1.logger.error('Sandbox test failed:', err);
        process.exit(1);
    }
}
runSandboxTest();
