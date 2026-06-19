import mongoose from "mongoose";
import dotenv from "dotenv";
import MyPlant from "../src/models/my_plant_model";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
const USER_ID = "6a34bc5a27f1ee0a94b8f6d9";

const checkDB = async () => {
  try {
    if (!MONGO_URI) throw new Error("MONGO_URI is missing");
    await mongoose.connect(MONGO_URI);
    const plants = await MyPlant.find({ user: USER_ID });
    console.log(`Found ${plants.length} plants for user ${USER_ID}`);
    if (plants.length > 0) {
      console.log(plants[0]);
    }
    
    // Also check all users to find actual user IDs
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`Users in DB: ${users.map(u => u._id.toString()).join(', ')}`);
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
};

checkDB();
