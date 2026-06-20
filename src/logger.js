"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var winston_1 = __importDefault(require("winston"));
var transports = [new winston_1.default.transports.Console()];
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
    transports.push(new winston_1.default.transports.File({ filename: 'logs/app.log' }));
}
var logger = winston_1.default.createLogger({
    level: 'info',
    format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json()),
    transports: transports
});
exports.default = logger;
