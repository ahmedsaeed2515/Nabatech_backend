const mongoose = require('mongoose');

// This script scans all collections in MongoDB and repairs Mojibake encoding.
// Run this script via: node repair_arabic_db.js

async function repairDb() {
  await mongoose.connect('mongodb://127.0.0.1:27017/nabatech');
  console.log("Connected to MongoDB. Scanning for Mojibake (Ø§Ù„Ù†Ø¨Ø§Øª)...");

  const collections = await mongoose.connection.db.collections();
  let repairedCount = 0;
  
  for (const collection of collections) {
    const docs = await collection.find({}).toArray();
    for (const doc of docs) {
      let docModified = false;
      
      // Deep iterate the document fields
      function traverseAndRepair(obj) {
        for (const key in obj) {
          if (typeof obj[key] === 'string') {
            if (obj[key].includes('Ø§') || obj[key].includes('Ù')) {
              try {
                // Decode latin1 -> utf8
                obj[key] = Buffer.from(obj[key], 'latin1').toString('utf8');
                docModified = true;
              } catch (e) {
                // Ignore decoding errors
              }
            }
          } else if (obj[key] !== null && typeof obj[key] === 'object') {
            traverseAndRepair(obj[key]);
          }
        }
      }

      traverseAndRepair(doc);

      if (docModified) {
        await collection.updateOne({ _id: doc._id }, { $set: doc });
        console.log(`Repaired Arabic encoding in collection ${collection.collectionName}, Doc ID: ${doc._id}`);
        repairedCount++;
      }
    }
  }

  console.log(`\nScan complete. Total documents repaired: ${repairedCount}`);
  await mongoose.disconnect();
}

repairDb().catch(console.error);
