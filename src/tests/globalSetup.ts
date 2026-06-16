import { MongoMemoryReplSet } from "mongodb-memory-server";
import fs from "fs";

export default async function globalSetup() {
  // Prevent Mongoose from logging weird errors when starting
  process.env.MONGOMS_SERVER_STARTUP_TIMEOUT = "60000";
  process.env.MONGOMS_DOWNLOAD_DIR = "D:\\tmp_mongo_cache";

  if (!fs.existsSync('D:\\tmp_mongo')) {
    fs.mkdirSync('D:\\tmp_mongo', { recursive: true });
  }

  const replSet = await MongoMemoryReplSet.create({
    replSet: { count: 1 },
    instanceOpts: [
      { dbPath: 'D:\\tmp_mongo' }
    ],
    binary: { version: '6.0.4' }
  });

  process.env.MONGODB_URI_TEST = replSet.getUri();
  (global as any).__MONGOINSTANCE = replSet;
}
