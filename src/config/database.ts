import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const connectDB = async () => {
    try{
      const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
      if (!mongoUri) {
        throw new Error("Missing MONGODB_URI (or MONGO_URI) environment variable");
      }
      const conn =  await mongoose.connect(mongoUri);
      console.log(`Database connected successfully ${conn.connection.host}`);
    }catch (error) {
      console.error(`Database Connection Error: ${error}`);
      process.exit(1);
    }
}


export default connectDB;
