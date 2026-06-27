require('dotenv').config();
const mongoose = require('mongoose');

async function setFastest() {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  await db.collection('aisettings').updateOne({}, {
    $set: { 'aiModePriority': ['hf_grok', 'rag_openai', 'hf_v62', 'hf_v8'] }
  });
  console.log('Successfully updated priority: hf_grok -> rag_openai');
  process.exit(0);
}
setFastest().catch(console.error);
