import { MongoMemoryReplSet } from "mongodb-memory-server";

async function run() {
  process.env.MONGOMS_SERVER_STARTUP_TIMEOUT = "60000";
  process.env.MONGOMS_DOWNLOAD_DIR = "D:\\tmp_mongo_cache";
  console.log("Starting replica set...");
  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [
      { dbPath: 'D:\\tmp_mongo' }
    ],
    binary: { version: '6.0.4' }
  });
  console.log("Started. URI: ", replSet.getUri());
  await replSet.stop();
  console.log("Stopped.");
}
run().catch(console.error);
