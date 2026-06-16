import { MongoMemoryReplSet } from "mongodb-memory-server";
import fs from "fs";

export default async function globalTeardown() {
  const instance: MongoMemoryReplSet = (global as any).__MONGOINSTANCE;
  if (instance) {
    await instance.stop();
  }
  if (fs.existsSync('D:\\tmp_mongo')) {
    fs.rmSync('D:\\tmp_mongo', { recursive: true, force: true });
  }
}
