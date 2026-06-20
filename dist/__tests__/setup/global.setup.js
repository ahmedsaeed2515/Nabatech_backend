"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const mongoose_1 = __importDefault(require("mongoose"));
let mongod;
// يشتغل مرة واحدة قبل كل الـ tests
beforeAll(async () => {
    mongod = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose_1.default.connect(uri);
    console.log('[TEST SETUP] In-memory MongoDB connected:', uri);
});
// ينظف الداتا بين كل test
afterEach(async () => {
    const collections = mongoose_1.default.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
});
// يقفل بعد كل الـ tests
afterAll(async () => {
    await mongoose_1.default.connection.dropDatabase();
    await mongoose_1.default.connection.close();
    await mongod.stop();
    console.log('[TEST SETUP] In-memory MongoDB disconnected');
});
