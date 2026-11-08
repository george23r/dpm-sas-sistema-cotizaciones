import { loadEnv } from "./config/env.js";
import { pool } from "./db/pool.js";
import { buildApp } from "./app.js";

const env = loadEnv();
const server = buildApp().listen(env.PORT, () => console.log(`DPM API escuchando en puerto ${env.PORT}`));

async function shutdown(signal: string) {
  console.log(`Recibido ${signal}; cerrando servidor.`);
  server.close(async () => { await pool.end(); process.exit(0); });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
