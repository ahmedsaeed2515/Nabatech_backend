import { faker } from '@faker-js/faker';
import mongoose from 'mongoose';

export const createFakeUser = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  name: faker.person.fullName(),
  email: faker.internet.email(),
  password: 'hashedpassword123',
  role: 'user',
  country: 'Egypt',
  fcmToken: faker.string.alphanumeric(100),
  isActive: true,
  createdAt: new Date(),
  ...overrides
});

export const createFakeZone = (userId: string, gardenId: string, overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  user: new mongoose.Types.ObjectId(userId),
  garden: new mongoose.Types.ObjectId(gardenId),
  name: faker.word.noun() + ' Zone',
  type: 'PARTIAL_SHADE',
  createdAt: new Date(),
  ...overrides
});

export const createFakeGarden = (userId: string, overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  user: new mongoose.Types.ObjectId(userId),
  name: faker.word.adjective() + ' Garden',
  type: 'OUTDOOR',
  createdAt: new Date(),
  ...overrides
});

export const createFakePlantDna = (overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  species: faker.science.chemicalElement().name, // placeholder
  nameEn: faker.word.noun(),
  nameAr: 'نبات تجريبي',
  waterFrequencyDays: faker.number.int({ min: 1, max: 7 }),
  fertilizerRequirements: 'NPK 10-10-10 monthly',
  ...overrides
});

export const createFakePlant = (userId: string, zoneId: string, overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  user: new mongoose.Types.ObjectId(userId),
  zone: new mongoose.Types.ObjectId(zoneId),
  species: 'Tomato',
  name: 'My Tomato',
  stage: 'SEEDLING',
  healthScore: 75,
  lastWatered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  ...overrides
});

export const createFakeEscalation = (userId: string, overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  userId: new mongoose.Types.ObjectId(userId),
  imagePath: 'uploads/test-image.jpg',
  status: 'pending',
  confidence: 0.35,
  aiDiagnosis: 'Possible powdery mildew',
  createdAt: new Date(),
  ...overrides
});

export const createFakeDiagnosis = (userId: string, overrides = {}) => ({
  _id: new mongoose.Types.ObjectId(),
  userId: new mongoose.Types.ObjectId(userId),
  diseaseNameEn: 'Powdery Mildew',
  diseaseNameAr: 'البياض الدقيقي',
  confidence: 0.89,
  treatment: 'Apply neem oil spray weekly',
  createdAt: new Date(),
  ...overrides
});


