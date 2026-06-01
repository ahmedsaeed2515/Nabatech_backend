import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./config/database";
import { seedDefaultAdmin, seedPlantLibrary } from "./utils/seeder";

const PORT = process.env.PORT || 10000;

const startServer = async () => {
  try {
    await connectDB(); 
    await seedPlantLibrary(); // Seed Plant Library collections if empty
    await seedDefaultAdmin(); // Seed default admin account if missing

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });

  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};

startServer(); // Trigger dev server reload to connect to MongoDB
