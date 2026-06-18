import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { predictPlantDisease } from './src/controllers/diagnosis_controller';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nabatech');
  console.log('Connected to DB');

  const req = {
    user: { id: new mongoose.Types.ObjectId().toString() },
    file: {
      buffer: Buffer.from('fake image data'),
      originalname: 'test.jpg'
    },
    body: {}
  } as unknown as Request;

  const res = {
    status: (code: any) => {
      console.log('Status:', code);
      return {
        json: (data: any) => {
          console.log('Response:', data);
        }
      };
    }
  } as unknown as Response;

  // We patch console.error to intercept the exact error thrown
  const origError = console.error;
  console.error = (...args) => {
    origError('INTERCEPTED ERROR:', ...args);
  };

  await predictPlantDisease(req, res);
  process.exit(0);
}

run().catch(console.error);
