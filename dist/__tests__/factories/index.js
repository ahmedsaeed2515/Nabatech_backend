"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFakeDiagnosis = exports.createFakeEscalation = exports.createFakePlant = exports.createFakePlantDna = exports.createFakeGarden = exports.createFakeZone = exports.createFakeUser = void 0;
const faker_1 = require("@faker-js/faker");
const mongoose_1 = __importDefault(require("mongoose"));
const createFakeUser = (overrides = {}) => ({
    _id: new mongoose_1.default.Types.ObjectId(),
    name: faker_1.faker.person.fullName(),
    email: faker_1.faker.internet.email(),
    password: 'hashedpassword123',
    role: 'user',
    country: 'Egypt',
    fcmToken: faker_1.faker.string.alphanumeric(100),
    isActive: true,
    createdAt: new Date(),
    ...overrides
});
exports.createFakeUser = createFakeUser;
const createFakeZone = (userId, gardenId, overrides = {}) => ({
    _id: new mongoose_1.default.Types.ObjectId(),
    user: new mongoose_1.default.Types.ObjectId(userId),
    garden: new mongoose_1.default.Types.ObjectId(gardenId),
    name: faker_1.faker.word.noun() + ' Zone',
    type: 'PARTIAL_SHADE',
    createdAt: new Date(),
    ...overrides
});
exports.createFakeZone = createFakeZone;
const createFakeGarden = (userId, overrides = {}) => ({
    _id: new mongoose_1.default.Types.ObjectId(),
    user: new mongoose_1.default.Types.ObjectId(userId),
    name: faker_1.faker.word.adjective() + ' Garden',
    type: 'OUTDOOR',
    createdAt: new Date(),
    ...overrides
});
exports.createFakeGarden = createFakeGarden;
const createFakePlantDna = (overrides = {}) => ({
    _id: new mongoose_1.default.Types.ObjectId(),
    species: faker_1.faker.science.chemicalElement().name, // placeholder
    nameEn: faker_1.faker.word.noun(),
    nameAr: 'نبات تجريبي',
    waterFrequencyDays: faker_1.faker.number.int({ min: 1, max: 7 }),
    fertilizerRequirements: 'NPK 10-10-10 monthly',
    ...overrides
});
exports.createFakePlantDna = createFakePlantDna;
const createFakePlant = (userId, zoneId, overrides = {}) => ({
    _id: new mongoose_1.default.Types.ObjectId(),
    user: new mongoose_1.default.Types.ObjectId(userId),
    zone: new mongoose_1.default.Types.ObjectId(zoneId),
    species: 'Tomato',
    name: 'My Tomato',
    stage: 'SEEDLING',
    healthScore: 75,
    lastWatered: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    createdAt: new Date(),
    ...overrides
});
exports.createFakePlant = createFakePlant;
const createFakeEscalation = (userId, overrides = {}) => ({
    _id: new mongoose_1.default.Types.ObjectId(),
    userId: new mongoose_1.default.Types.ObjectId(userId),
    imagePath: 'uploads/test-image.jpg',
    status: 'pending',
    confidence: 0.35,
    aiDiagnosis: 'Possible powdery mildew',
    createdAt: new Date(),
    ...overrides
});
exports.createFakeEscalation = createFakeEscalation;
const createFakeDiagnosis = (userId, overrides = {}) => ({
    _id: new mongoose_1.default.Types.ObjectId(),
    userId: new mongoose_1.default.Types.ObjectId(userId),
    diseaseNameEn: 'Powdery Mildew',
    diseaseNameAr: 'البياض الدقيقي',
    confidence: 0.89,
    treatment: 'Apply neem oil spray weekly',
    createdAt: new Date(),
    ...overrides
});
exports.createFakeDiagnosis = createFakeDiagnosis;
