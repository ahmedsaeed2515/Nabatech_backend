"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'test', 'production']).default('development'),
    PORT: zod_1.z.string().default('10000'),
    MONGODB_URI: zod_1.z.string().optional(),
    MONGO_URI: zod_1.z.string().optional(),
    JWT_SECRET: zod_1.z.string().min(1, "JWT_SECRET is required"),
    JWT_REFRESH_SECRET: zod_1.z.string().min(1, "JWT_REFRESH_SECRET is required"),
    TOKEN_HASH_SECRET: zod_1.z.string().min(1, "TOKEN_HASH_SECRET is required"),
    CRON_SECRET: zod_1.z.string().optional(),
    DEPLOYMENT_MODE: zod_1.z.enum(['single-instance', 'multi-instance', 'serverless']).default('single-instance'),
    ALLOWED_ORIGINS: zod_1.z.string().optional(),
    FIREBASE_CREDENTIALS: zod_1.z.string().optional(),
    GEMINI_API_KEY: zod_1.z.string().optional(),
    OPENWEATHERMAP_API_KEY: zod_1.z.string().optional(),
    EMAIL_USER: zod_1.z.string().optional(),
    EMAIL_PASS: zod_1.z.string().optional(),
    PYTHON_ML_API_URL: zod_1.z.string().url().optional()
}).refine(data => data.MONGODB_URI || data.MONGO_URI, {
    message: "Either MONGODB_URI or MONGO_URI must be provided",
    path: ["MONGODB_URI"],
});
const _env = envSchema.safeParse(process.env);
if (!_env.success) {
    console.error('❌ FATAL: Invalid environment variables:');
    console.error(JSON.stringify(_env.error.format(), null, 2));
    // Fail fast — never run with broken config in production
    if (process.env.NODE_ENV !== 'test') {
        process.exit(1);
    }
}
exports.env = _env.success ? _env.data : process.env;
