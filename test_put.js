const mongoose = require('mongoose');
const Plant = require('./dist/models/plant_model').default;
require('dotenv').config();

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const plant = await Plant.findOne({});
  console.log("Found plant:", plant._id);
  plant.nameEn = "Test update " + Date.now();
  try {
    await plant.save();
    console.log("Saved successfully");
  } catch (err) {
    console.error("Save error:", err);
  }
  process.exit();
}
run();
