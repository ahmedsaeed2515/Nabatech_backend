import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function checkTokens() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    const usersWithTokens = await mongoose.connection.collection('users').find({
      fcmTokens: { $exists: true, $not: { $size: 0 } }
    }).toArray();
    
    console.log('Users with tokens:', usersWithTokens.length);
    
    const totalUsers = await mongoose.connection.collection('users').countDocuments();
    console.log('Total users:', totalUsers);
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

checkTokens();
