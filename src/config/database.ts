import mongoose from "mongoose";
import dotenv from "dotenv";
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
      console.log(`Error: ${error}`);
//       process.exit(1);  
    }                
} 


export default connectDB;
