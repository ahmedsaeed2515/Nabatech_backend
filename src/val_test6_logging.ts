import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  console.log("=== TEST 6: LOGGING VALIDATION ===");
  
  const AiCallLog = mongoose.connection.collection("aicalllogs");

  // Fetch the 5 most recent logs
  const logs = await AiCallLog.find().sort({ createdAt: -1 }).limit(5).toArray();

  for (const log of logs) {
    console.log(`\nLog ID: ${log._id}`);
    console.log(`- Provider Used: ${log.provider}`);
    console.log(`- Model Used: ${log.model}`);
    console.log(`- Latency: ${log.latencyMs}ms`);
    console.log(`- Success Status: ${log.status}`);
    if (log.error) {
      console.log(`- Error Logged: ${log.error}`);
    }
    console.log(`- Timestamp: ${log.createdAt}`);
  }

  process.exit(0);
}

run().catch(console.error);
