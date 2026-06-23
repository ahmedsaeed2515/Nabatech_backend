import mongoose from 'mongoose';
import User from './src/models/user_model';
import { NotificationService } from './src/services/NotificationService';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function verify() {
  console.log('Connecting to DB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nabatech');

  // Find a user with a real FCM token (exclude the mock ones)
  const user = await User.findOne({ fcmToken: { $exists: true, $nin: ['test-token-device-xyz', '', null] } });
  
  if (!user || !user.fcmToken) {
    console.error('No real FCM token found in the database. Please log in on a real device first.');
    await mongoose.disconnect();
    return;
  }

  console.log('Found user with FCM token:', user.fcmToken.substring(0, 15) + '...');

  const notifService = new NotificationService();
  
  try {
    console.log('Attempting to send push notification via Firebase Admin...');
    await notifService.sendPushNotification(user.fcmToken, {
      notification: {
        title: 'NabaTech Test',
        body: 'Push notifications are working successfully.'
      },
      data: { route: '/' }
    });
    console.log('FCM Payload executed successfully');
  } catch (e: any) {
    console.error('Failed to send notification:', e.message);
  }

  await mongoose.disconnect();
}

verify().catch(console.error);
