import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from backend/.env
dotenv.config({ path: path.join(__dirname, '../.env') });

import '../src/models/plant_dna_model';

const seedData = [
  {
    species: "Apple",
    scientificName: "Malus domestica",
    toxicity: false,
    minTemp: -20,
    maxTemp: 32,
    lightReq: "Full Sun",
    waterFrequencyDays: 7
  },
  {
    species: "Blueberry",
    scientificName: "Vaccinium corymbosum",
    toxicity: false,
    minTemp: -30,
    maxTemp: 30,
    lightReq: "Full Sun to Partial Shade",
    waterFrequencyDays: 3
  },
  {
    species: "Cherry",
    scientificName: "Prunus avium",
    toxicity: true, // Seeds, leaves are toxic
    minTemp: -20,
    maxTemp: 30,
    lightReq: "Full Sun",
    waterFrequencyDays: 7
  },
  {
    species: "Corn",
    scientificName: "Zea mays",
    toxicity: false,
    minTemp: 10,
    maxTemp: 35,
    lightReq: "Full Sun",
    waterFrequencyDays: 4
  },
  {
    species: "Grape",
    scientificName: "Vitis vinifera",
    toxicity: true, // Toxic to pets (dogs/cats)
    minTemp: -15,
    maxTemp: 35,
    lightReq: "Full Sun",
    waterFrequencyDays: 7
  },
  {
    species: "Orange",
    scientificName: "Citrus sinensis",
    toxicity: false,
    minTemp: -2,
    maxTemp: 38,
    lightReq: "Full Sun",
    waterFrequencyDays: 7
  },
  {
    species: "Peach",
    scientificName: "Prunus persica",
    toxicity: true, // Seeds, leaves are toxic
    minTemp: -20,
    maxTemp: 35,
    lightReq: "Full Sun",
    waterFrequencyDays: 7
  },
  {
    species: "Pepper",
    scientificName: "Capsicum annuum",
    toxicity: false, // Fruits are edible, foliage can be mildly toxic
    minTemp: 15,
    maxTemp: 35,
    lightReq: "Full Sun",
    waterFrequencyDays: 3
  },
  {
    species: "Potato",
    scientificName: "Solanum tuberosum",
    toxicity: true, // Green parts are toxic
    minTemp: 7,
    maxTemp: 27,
    lightReq: "Full Sun",
    waterFrequencyDays: 4
  },
  {
    species: "Raspberry",
    scientificName: "Rubus idaeus",
    toxicity: false,
    minTemp: -20,
    maxTemp: 30,
    lightReq: "Full Sun to Partial Shade",
    waterFrequencyDays: 4
  },
  {
    species: "Soybean",
    scientificName: "Glycine max",
    toxicity: false,
    minTemp: 10,
    maxTemp: 35,
    lightReq: "Full Sun",
    waterFrequencyDays: 5
  },
  {
    species: "Squash",
    scientificName: "Cucurbita pepo",
    toxicity: false,
    minTemp: 15,
    maxTemp: 35,
    lightReq: "Full Sun",
    waterFrequencyDays: 3
  },
  {
    species: "Strawberry",
    scientificName: "Fragaria × ananassa",
    toxicity: false,
    minTemp: -10,
    maxTemp: 30,
    lightReq: "Full Sun",
    waterFrequencyDays: 3
  },
  {
    species: "Tomato",
    scientificName: "Solanum lycopersicum",
    toxicity: true, // Leaves and stems are toxic
    minTemp: 15,
    maxTemp: 35,
    lightReq: "Full Sun",
    waterFrequencyDays: 3
  }
];

async function seedPlantDna() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/nabatech');
  
  const PlantDna = mongoose.model('PlantDna');

  try {
    console.log("Clearing existing generic PlantDna records...");
    await PlantDna.deleteMany({}); // Delete existing records so we start fresh

    console.log(`Seeding ${seedData.length} plant records...`);
    await PlantDna.insertMany(seedData);
    
    console.log("Seeding complete. Successfully added crops:", seedData.map(d => d.species).join(", "));
  } catch (error) {
    console.error("Error seeding PlantDna:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

seedPlantDna();
