import mongoose from 'mongoose';
import AiSettings from './src/models/ai_settings_model';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGO_URI as string);
  const settings = await AiSettings.findOne();
  console.log(JSON.stringify(settings, null, 2));
  process.exit(0);
}
check().catch(console.error);
