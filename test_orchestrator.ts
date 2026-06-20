import dotenv from 'dotenv';
dotenv.config();

import { orchestrateAssistantRequest } from './src/services/ai/ai_orchestrator_service.js';

async function runTest() {
    try {
        console.log('Running test...');
        const result = await orchestrateAssistantRequest({
            userId: 'test_user_123',
            file: {
                buffer: Buffer.alloc(10), // dummy buffer, the CNN mock might pass or fail based on this, wait, the CNN is remote!
                mimetype: 'image/jpeg',
                originalname: 'test.jpg'
            },
            question: 'What is wrong with my apple tree?'
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
