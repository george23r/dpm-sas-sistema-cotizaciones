import pg from "pg";
import { loadEnv } from "../config/env.js";

const { Pool } = pg;
const env = loadEnv();

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export async function closePool() {
  await pool.end();
}
