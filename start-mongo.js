require('dotenv').config();
const { MongoMemoryReplSet } = require('mongodb-memory-server');
async function run() {
  try {
    const replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, name: 'rs0' },
      instanceOpts: [
        { port: 27017 }
      ]
    });
    console.log(`MongoMemoryServer running on ${replSet.getUri()}`);
  } catch(e) {
    console.error(e);
  }
}

run();
