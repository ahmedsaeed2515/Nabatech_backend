"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
dotenv_1.default.config();
const connectDB = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            throw new Error("Missing MONGODB_URI (or MONGO_URI) environment variable");
        }
        // Add robust connection options
        const conn = await mongoose_1.default.connect(mongoUri, {
            serverSelectionTimeoutMS: 15000, // 15 seconds timeout
            socketTimeoutMS: 45000,
            family: 4 // Force IPv4
        });
        console.log(`Database connected successfully ${conn.connection.host}`);
    }
    catch (error) {
        throw error;
    }
};
exports.default = connectDB;
