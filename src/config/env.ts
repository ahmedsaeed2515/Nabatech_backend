import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('10000'),
  MONGODB_URI: z.string().optional(),
  MONGO_URI: z.string().optional(),
  JWT_SECRET: z.string().min(1, "JWT_SECRET is required"),
  JWT_REFRESH_SECRET: z.string().min(1, "JWT_REFRESH_SECRET is required"),
  TOKEN_HASH_SECRET: z.string().min(1, "TOKEN_HASH_SECRET is required"),
  CRON_SECRET: z.string().optional(),
  DEPLOYMENT_MODE: z.enum(['single-instance', 'multi-instance', 'serverless']).default('single-instance'),
  ALLOWED_ORIGINS: z.string().optional(),
  EMAIL_USER: z.string().optional(),
  EMAIL_PASS: z.string().optional()
}).refine(data => data.MONGODB_URI || data.MONGO_URI, {
  message: "Either MONGODB_URI or MONGO_URI must be provided",
  path: ["MONGODB_URI"],
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(_env.error.format(), null, 2));
  process.exit(1);
}

export const env = _env.data;
