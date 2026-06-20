import dotenv from 'dotenv';
dotenv.config();

import fs from 'fs';
import { orchestrateAssistantRequest } from './src/services/ai/ai_orchestrator_service';

async function runTest() {
    try {
        console.log('Running REAL IMAGE test...');
        const imagePath = "C:\\Users\\Ahmed Saeed\\.gemini\\antigravity\\brain\\35648f79-68ff-4dc3-87b0-8d329b07ae20\\media__1781856191815.png";
        const buffer = fs.readFileSync(imagePath);
        
        const result = await orchestrateAssistantRequest({
            userId: 'test_user_123',
            fileBuffer: buffer,
            originalName: 'test.png',
            question: 'What is wrong with my plant?',
            history: []
        });
        console.log('--- TEST RESULT ---');
        console.dir(result, { depth: null });
        process.exit(0);
    } catch (error) {
        console.error('TEST ERROR:', error);
        process.exit(1);
    }
}

runTest();
