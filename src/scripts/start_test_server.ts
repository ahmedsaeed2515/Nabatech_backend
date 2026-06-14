process.env.MONGOMS_SERVER_STARTUP_TIMEOUT = '60000';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../app';
import mongoose from 'mongoose';
import { seedDefaultAdmin, seedPlantLibrary } from '../utils/seeder';
import { startOutboxPolling, stopOutboxPolling } from '../workers/outbox_worker';

async function start() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  
  process.env.MONGO_URI = uri;
  process.env.MONGODB_URI = uri;
  process.env.JWT_SECRET = 'testsecret123';
  process.env.PORT = '10000';
  
  await mongoose.connect(uri);
  console.log('Connected to in-memory MongoDB at', uri);
  
  await seedPlantLibrary();
  await seedDefaultAdmin();
  
  startOutboxPolling(10000);
  
  const server = app.listen(10000, () => {
    console.log('Test server running on http://localhost:10000');
  });

  process.on('SIGINT', async () => {
    stopOutboxPolling();
    server.close();
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  });
}

start().catch(console.error);
