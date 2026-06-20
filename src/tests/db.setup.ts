process.env["MONGOMS_MD5_CHECK"] = "0";
process.env["MONGOMS_DISABLE_POSTINSTALL"] = "1";

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer | null = null;
let connectPromise: Promise<typeof mongoose> | null = null;

export const connectTestDB = async () => {
  // Fallbacks for tests if globalSetup didn't run properly
  process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecretjwtkey12345!";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "testrefreshsecret12345!";

  if (mongoose.connection.readyState === 1) return;
  if (!connectPromise) {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;
    connectPromise = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
  }
  await connectPromise;
};

export const disconnectTestDB = async () => {
  if (mongoose.connection.readyState === 1) {
    await mongoose.connection.db?.dropDatabase();
    await mongoose.connection.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
  connectPromise = null;
};

export const clearTestDB = async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
};
