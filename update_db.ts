import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { AiSettings } from './src/models/ai_settings_model';

async function updateDb() {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nabatech');
    
    const settings = await AiSettings.findOne({ key: 'default' });
    if (settings && settings.config && settings.config.rag) {
        console.log('Old DB RAG URL:', settings.config.rag.endpointUrl);
        settings.config.rag.endpointUrl = process.env.NEW_RAG_URL || 'https://ahmedsaeed111-rag-only.hf.space';
        settings.markModified('config.rag.endpointUrl');
        await settings.save();
        console.log('Updated DB RAG URL to:', settings.config.rag.endpointUrl);
    } else {
        console.log('No RAG config found in DB.');
    }
    
    process.exit(0);
}
updateDb();
