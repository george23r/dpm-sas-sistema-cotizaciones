import cors from "cors";
import cookieParser from "cookie-parser";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { loadEnv } from "./config/env.js";
import { pool } from "./db/pool.js";
import { requireSameOrigin } from "./middlewares/auth.js";
import { authRouter } from "./modules/auth/auth.router.js";
import { cotizacionesRouter } from "./modules/cotizaciones/cotizaciones.router.js";
import { errorHandler, HttpError } from "./shared/errors.js";

export function buildApp() {
  const env = loadEnv();
  const app = express();
  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true, methods: ["GET", "POST", "PATCH", "OPTIONS"] }));
  app.use(express.json({ limit: "100kb" }));
  app.use(cookieParser());
  app.use(requireSameOrigin);

  app.get("/health", (_request, response) => response.status(200).json({ status: "ok" }));
  app.get("/ready", async (_request, response, next) => {
    try {
      await pool.query("SELECT 1");
      response.status(200).json({ status: "ready" });
    } catch {
      next(new HttpError(503, "DATABASE_UNAVAILABLE", "La base de datos no está disponible."));
    }
  });

  app.use("/api/v1/auth", rateLimit({ windowMs: 15 * 60 * 1000, limit: 20, standardHeaders: "draft-8", legacyHeaders: false }), authRouter);
  app.use("/api/v1/cotizaciones", cotizacionesRouter);
  app.use((request, _response, next) => next(new HttpError(404, "NOT_FOUND", `Ruta no encontrada: ${request.method} ${request.path}`)));
  app.use(errorHandler);
  return app;
}

const app = buildApp();
const env = loadEnv();
const server = app.listen(env.PORT, () => console.log(`DPM API escuchando en puerto ${env.PORT}`));

async function shutdown(signal: string) {
  console.log(`Recibido ${signal}; cerrando servidor.`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
