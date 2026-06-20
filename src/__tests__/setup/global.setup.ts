import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongod: MongoMemoryServer;

// يشتغل مرة واحدة قبل كل الـ tests
beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
  console.log('[TEST SETUP] In-memory MongoDB connected:', uri);
});

// ينظف الداتا بين كل test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

// يقفل بعد كل الـ tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
  console.log('[TEST SETUP] In-memory MongoDB disconnected');
});
