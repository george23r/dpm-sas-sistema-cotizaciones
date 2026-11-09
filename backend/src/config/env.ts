import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  CORS_ORIGIN: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  SESSION_TTL_SECONDS: z.coerce.number().int().positive().default(28_800),
  LOGIN_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  COOKIE_NAME: z.string().min(1).default("dpm_session"),
  COOKIE_SAMESITE: z.enum(["lax", "strict", "none"]).default("lax"),
  DB_SSL: z.enum(["true", "false"]).default("false"),
});

export function loadEnv(source: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse(source);
}
