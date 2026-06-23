import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
dotenv.config();

import './src/models/plant_dna_model';

async function inspectDna() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nabatech');
  
  const PlantDna = mongoose.model('PlantDna');
  
  try {
    const totalCount = await PlantDna.countDocuments();
    console.log(`\n1. Total records count: ${totalCount}`);
    
    const first20 = await PlantDna.find({}).limit(20).lean();
    console.log(`\n2. First ${first20.length} records:`, JSON.stringify(first20, null, 2));
    
    if (first20.length > 0) {
      console.log(`\n3. Fields available:`, Object.keys(first20[0]));
    } else {
      console.log(`\n3. Fields available: NONE (Collection is empty)`);
    }
    
    const allSpecies = await PlantDna.distinct('species');
    console.log(`\n4. Species values (${allSpecies.length} total):`, allSpecies);
    
    const searches = ['Tomato', 'Potato', 'Pepper', 'Cucumber', 'Rose'];
    console.log(`\n5. Search results:`);
    for (const s of searches) {
      const match = await PlantDna.find({ species: { $regex: s, $options: "i" } }).lean();
      console.log(`   Search for "${s}": found ${match.length} records`);
      if (match.length > 0) {
        console.log(`     -> ${match.map((m: any) => m.species).join(', ')}`);
      }
    }
    
  } catch (error) {
    console.error("Error inspecting database:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected.");
  }
}

inspectDna();
