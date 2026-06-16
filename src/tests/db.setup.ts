import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let connectPromise: Promise<typeof mongoose> | null = null;

export const connectTestDB = async () => {
  // Fallbacks for tests if globalSetup didn't run properly
  process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecretjwtkey12345!";
  process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "testrefreshsecret12345!";

  if (mongoose.connection.readyState === 1) return;
  if (!connectPromise) {
    const uri = process.env.MONGODB_URI_TEST || "mongodb://127.0.0.1:27017/nabatech_test";
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
