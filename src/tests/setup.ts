import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import jwt from 'jsonwebtoken';
import { UserRole, UserLevel } from '../models/user_model';
import UserModel from '../models/user_model';
import { env } from '../config/env';

let mongoServer: MongoMemoryServer;

export const setupTestDB = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterEach(async () => {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });
};

export const loginUser = async (email: string = 'test@example.com', passwordHash: string = 'hashedpassword') => {
  const user = await UserModel.create({
    email,
    passwordHash,
    role: UserRole.USER,
    level: UserLevel.SPROUT,
    pushEnabled: true,
    autoAddEnabled: true,
  });

  const token = jwt.sign(
    { userId: user._id.toString(), role: user.role },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token, authHeader: `Bearer ${token}` };
};
