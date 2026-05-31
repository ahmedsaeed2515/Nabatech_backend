import mongoose from "mongoose";
import dotenv from "dotenv";

// Load default env variables
dotenv.config();

// Override for testing
process.env.MONGO_URI = "mongodb://127.0.0.1:27018/nabatech_test";
process.env.JWT_SECRET = "testsecretjwtkey12345!";

export const connectTestDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI as string);
    }
  } catch (error) {
    console.error("Test DB Connection Error:", error);
    throw error;
  }
};

export const disconnectTestDB = async () => {
  try {
    // Drop test database to clean up completely after all tests
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.db?.dropDatabase();
      await mongoose.connection.close();
    }
  } catch (error) {
    console.error("Test DB Disconnect Error:", error);
  }
};

export const clearTestDB = async () => {
  try {
    if (mongoose.connection.readyState !== 0) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    }
  } catch (error) {
    console.error("Test DB Clear Error:", error);
  }
};
