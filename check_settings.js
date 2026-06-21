require('dotenv').config();
const mongoose = require('mongoose');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const settings = await db.collection('aisettings').findOne();
  console.log(JSON.stringify(settings, null, 2));
  process.exit(0);
}
check().catch(console.error);
