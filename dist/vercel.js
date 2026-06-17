"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handler;
const database_1 = __importDefault(require("./config/database"));
let appInstance = null;
async function handler(req, res) {
    try {
        if (!appInstance) {
            console.log("Initializing serverless app...");
            // Initialize database connection
            await (0, database_1.default)();
            // Lazy load the app to catch any top-level module errors
            const appModule = require('./app');
            appInstance = appModule.default || appModule;
            console.log("App loaded successfully");
        }
        // Pass the request to the Express app
        return appInstance(req, res);
    }
    catch (error) {
        console.error("FATAL SERVERLESS INITIALIZATION ERROR:", error);
        res.status(500).json({
            success: false,
            error: "Server Initialization Failed",
            details: error.message,
            stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        });
    }
}
module.exports = handler;
