import pg from "pg";
import { loadEnv } from "../config/env.js";

const { Pool } = pg;
const env = loadEnv();

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  // El SQL existente define funciones/procedimientos con referencias
  // relativas al esquema dpm; fijar el search_path evita que fallen al
  // invocarse desde una conexión de la API.
  options: "-c search_path=dpm,public",
  ssl: env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  max: 10,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

export async function closePool() {
  await pool.end();
}
