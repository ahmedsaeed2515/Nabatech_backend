import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();

async function testFcm() {
  try {
    await mongoose.connect(process.env.MONGO_URI as string);
    const db = mongoose.connection;
    const user = await db.collection('users').findOne({});
    if (!user) throw new Error('No user found');
    
    // Simulate what the route would do
    console.log('Found user:', user._id);
    
    // The problem in the backend broadcast was it checked `token && token.trim() !== ''`
    // Wait, the broadcast route expects `fcmToken`, but maybe the flutter app doesn't trigger requestPermission?
    
    // Let's check the admin_notifications_controller.ts logic.
    // In admin_notifications_controller.ts we had:
    // const users = await User.find(userQuery).select('_id fcmToken');
    // const tokens = users.map(u => u.fcmToken).filter(token => token && token.trim() !== '');
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

testFcm();
