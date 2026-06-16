import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const connectDB = async () => {
    try {
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error("Missing MONGODB_URI (or MONGO_URI) environment variable");
      }
      // Add robust connection options
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 15000, // 15 seconds timeout
        socketTimeoutMS: 45000,
        family: 4 // Force IPv4
      });
      console.log(`Database connected successfully ${conn.connection.host}`);
    } catch (error) {
      console.error(`Database Connection Error: ${error}`);
      process.exit(1);
    }
}


export default connectDB;
