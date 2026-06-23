import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkTokens() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    const usersWithTokens = await mongoose.connection.collection('users').find({
      fcmToken: { $exists: true, $ne: null, $ne: "" }
    }).toArray();
    
    console.log('Users with fcmToken string:', usersWithTokens.length);
    
    if (usersWithTokens.length > 0) {
      console.log('Sample token:', usersWithTokens[0].fcmToken);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkTokens();
