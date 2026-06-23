import mongoose from 'mongoose';
import User from './src/models/user_model';
import { NotificationService } from './src/services/NotificationService';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function verify() {
  console.log('Connecting to DB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nabatech');

  // Find or create test user
  let user = await User.findOne({ email: 'fcm_test@nabatech.com' });
  if (!user) {
    user = await User.create({
      name: 'FCM Test User',
      email: 'fcm_test@nabatech.com',
      passwordHash: 'password123',
    });
  }

  // Update FCM token
  user.fcmToken = 'test-token-device-xyz';
  await user.save();
  console.log('User FCM token updated in DB:', user.fcmToken);

  // Initialize Notification Service
  console.log('Initializing Notification Service...');
  const notifService = new NotificationService();
  
  try {
    // Attempt to send
    console.log('Attempting to send push notification via Firebase Admin...');
    await notifService.sendPushNotification(user.fcmToken, {
      title: 'Test FCM Verification',
      body: 'This is a test notification payload',
      data: { route: '/test' }
    });
    console.log('FCM Payload executed');
  } catch (e: any) {
    console.error('Expected failure with mock token:', e.message);
  }

  await mongoose.disconnect();
}

verify().catch(console.error);
