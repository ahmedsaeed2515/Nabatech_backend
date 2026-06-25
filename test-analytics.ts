import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { getCommunityAnalytics } from './src/controllers/admin_community_controller';
import User from './src/models/user_model'; // Fix User registration issue locally

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI as string);
  console.log('Connected to DB');
  // Just reference User to ensure it's loaded
  const _userModel = User;
  
  const req = {} as any;
  const res = {
    status: (code: number) => {
      console.log('Status:', code);
      return {
        json: (data: any) => console.log('JSON:', JSON.stringify(data, null, 2))
      };
    }
  } as any;
  
  // Override the logger temporarily to see the error
  const loggerPath = require.resolve('./src/utils/logger');
  const logger = require(loggerPath).logger;
  logger.error = (msg: string, meta: any) => {
    console.log('LOGGER ERROR:', msg);
    console.log('ACTUAL ERROR:', meta.error);
    if (meta.error && meta.error.stack) {
      console.log('STACK:', meta.error.stack);
    }
  };
  
  try {
    await getCommunityAnalytics(req, res);
  } catch (e) {
    console.error('Error in controller:', e);
  }
  
  await mongoose.disconnect();
};

run().catch(console.error);
