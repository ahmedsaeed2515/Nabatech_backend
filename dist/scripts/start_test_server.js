"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.MONGOMS_SERVER_STARTUP_TIMEOUT = '60000';
const mongodb_memory_server_1 = require("mongodb-memory-server");
const app_1 = __importDefault(require("../app"));
const mongoose_1 = __importDefault(require("mongoose"));
const seeder_1 = require("../utils/seeder");
const outbox_worker_1 = require("../workers/outbox_worker");
async function start() {
    const mongod = await mongodb_memory_server_1.MongoMemoryServer.create();
    const uri = mongod.getUri();
    process.env.MONGO_URI = uri;
    process.env.MONGODB_URI = uri;
    process.env.JWT_SECRET = 'testsecret123';
    process.env.PORT = '10000';
    await mongoose_1.default.connect(uri);
    console.log('Connected to in-memory MongoDB at', uri);
    await (0, seeder_1.seedPlantLibrary)();
    await (0, seeder_1.seedDefaultAdmin)();
    (0, outbox_worker_1.startOutboxPolling)(10000);
    const server = app_1.default.listen(10000, () => {
        console.log('Test server running on http://localhost:10000');
    });
    process.on('SIGINT', async () => {
        (0, outbox_worker_1.stopOutboxPolling)();
        server.close();
        await mongoose_1.default.disconnect();
        await mongod.stop();
        process.exit(0);
    });
}
start().catch(console.error);
