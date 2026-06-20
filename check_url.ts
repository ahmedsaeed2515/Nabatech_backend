import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { getAiSettings } from './src/services/ai/ai_config_service';

async function checkUrl() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nabatech');
    const settings = await getAiSettings();
    console.log('RAG Enabled:', settings.rag.enabled);
    console.log('RAG Endpoint URL:', settings.rag.endpointUrl);
    
    const baseUrl = settings.rag.endpointUrl
        .replace(/\/ask(\/stream)?$/, '')
        .replace(/\/$/, '');
    const retrieveUrl = \\/retrieve\;
    console.log('Retrieve URL:', retrieveUrl);
    process.exit(0);
}
checkUrl();
