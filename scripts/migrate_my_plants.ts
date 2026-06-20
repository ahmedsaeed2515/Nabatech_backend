// FIX [TASK-3.1]: One-time migration from MyPlant (V1) to Plant (V2)
import mongoose from 'mongoose';
import MyPlantModel from '../src/models/my_plant_model';
import PlantModel from '../src/models/plant_model';
import dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI!);

  const myPlants = await MyPlantModel.find({}).lean();
  let migrated = 0, skipped = 0;

  for (const mp of myPlants) {
    const exists = await PlantModel.findById(mp._id);
    if (exists) { skipped++; continue; }

    await PlantModel.create({
      _id: mp._id,
      user: mp.user || (mp as any).userId,
      name: mp.name || mp.species,
      species: mp.species,
      stage: mp.growthStage || 'SEEDLING',
      healthScore: (mp as any).healthScore || 75,
      lastWatered: mp.lastWatered,
      migratedFromV1: true,
      migratedAt: new Date()
    });
    migrated++;
  }

  console.log(`Migration complete: ${migrated} migrated, ${skipped} skipped`);
  await mongoose.disconnect();
}

migrate().catch(console.error);
