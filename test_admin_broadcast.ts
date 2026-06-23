import mongoose from 'mongoose';
import { broadcastNotification, getBroadcastHistory } from './src/controllers/admin_notifications_controller';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

async function verify() {
  console.log('Connecting to DB...');
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nabatech');

  const req = {
    body: {
      title: 'Admin Broadcast Test',
      message: 'This is a test broadcast.',
      targetAudience: 'ALL'
    },
    user: { _id: new mongoose.Types.ObjectId() } // mock admin
  } as any;

  const res = {
    status: (code: number) => {
      console.log(`Status: ${code}`);
      return {
        json: (data: any) => console.log('JSON:', JSON.stringify(data, null, 2))
      };
    }
  } as any;

  console.log('Testing Broadcast API...');
  await broadcastNotification(req, res);

  console.log('Testing History API...');
  await getBroadcastHistory(req, res);

  await mongoose.disconnect();
}

verify().catch(console.error);
