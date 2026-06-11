import mongoose from "mongoose";
import dotenv from "dotenv";
import { MongoMemoryReplSet } from "mongodb-memory-server";

dotenv.config();

process.env.MONGODB_URI_TEST =
  process.env.MONGODB_URI_TEST ||
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/nabatech_test";
process.env.MONGO_URI = process.env.MONGODB_URI_TEST;
process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecretjwtkey12345!";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "testrefreshsecret12345!";

let connectPromise: Promise<typeof mongoose> | null = null;
let memoryServer: MongoMemoryReplSet | null = null;

export const connectTestDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (!memoryServer) {
    memoryServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' }
    });
    process.env.MONGODB_URI_TEST = memoryServer.getUri();
    process.env.MONGO_URI = process.env.MONGODB_URI_TEST;
  }
  if (!connectPromise) {
    connectPromise = mongoose.connect(process.env.MONGODB_URI_TEST as string, {
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
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
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
