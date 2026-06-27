import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

import { orchestrateAssistantRequest } from "./src/services/ai/ai_orchestrator_service";
import { updateAiSettings } from "./src/services/ai/ai_config_service";

async function runTest() {
    try {
        console.log('🔗 Connecting to DB...');
        await mongoose.connect(process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/nabatech");
        
        console.log('⚙️ Forcing rag_openai priority...');
        await updateAiSettings({ aiModePriority: ["rag_openai"] });

        console.log('🚀 Running test...');
        const startTime = Date.now();
        const result = await orchestrateAssistantRequest({
            userId: 'test_user_123',
            question: 'كيف أعتني بنبات الطماطم؟',
            history: []
        });
        const timeTaken = Date.now() - startTime;
        
        console.log('--- TEST RESULT ---');
        console.log(`✅ Success!`);
        console.log(`⏱️ Time Taken: ${timeTaken} ms`);
        console.log(`🤖 Response: ${result.message}`);
        console.log(`📡 Provider used: ${result.provider}`);
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ TEST ERROR:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

runTest();
