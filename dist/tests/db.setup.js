"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearTestDB = exports.disconnectTestDB = exports.connectTestDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
dotenv_1.default.config();
process.env.MONGODB_URI_TEST =
    process.env.MONGODB_URI_TEST ||
        process.env.MONGODB_URI ||
        process.env.MONGO_URI ||
        "mongodb://127.0.0.1:27017/nabatech_test";
process.env.MONGO_URI = process.env.MONGODB_URI_TEST;
process.env.JWT_SECRET = process.env.JWT_SECRET || "testsecretjwtkey12345!";
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "testrefreshsecret12345!";
let connectPromise = null;
let memoryServer = null;
const connectTestDB = async () => {
    if (mongoose_1.default.connection.readyState === 1)
        return;
    if (!memoryServer) {
        memoryServer = await mongodb_memory_server_1.MongoMemoryReplSet.create({
            replSet: { count: 1, storageEngine: 'wiredTiger' }
        });
        process.env.MONGODB_URI_TEST = memoryServer.getUri();
        process.env.MONGO_URI = process.env.MONGODB_URI_TEST;
    }
    if (!connectPromise) {
        connectPromise = mongoose_1.default.connect(process.env.MONGODB_URI_TEST, {
            serverSelectionTimeoutMS: 5000
        });
    }
    await connectPromise;
};
exports.connectTestDB = connectTestDB;
const disconnectTestDB = async () => {
    if (mongoose_1.default.connection.readyState === 1) {
        await mongoose_1.default.connection.db?.dropDatabase();
        await mongoose_1.default.connection.close();
    }
    if (memoryServer) {
        await memoryServer.stop();
        memoryServer = null;
    }
    connectPromise = null;
};
exports.disconnectTestDB = disconnectTestDB;
const clearTestDB = async () => {
    if (mongoose_1.default.connection.readyState === 1) {
        const collections = mongoose_1.default.connection.collections;
        for (const key in collections) {
            await collections[key].deleteMany({});
        }
    }
};
exports.clearTestDB = clearTestDB;
