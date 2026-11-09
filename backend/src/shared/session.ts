import jwt from "jsonwebtoken";
import type { CookieOptions, Response } from "express";
import { loadEnv } from "../config/env.js";
import type { AuthenticatedUser } from "./types.js";

interface SessionClaims {
  sub: string;
  nombre: string;
  correo: string;
  rol: AuthenticatedUser["rol"];
}

function options(): CookieOptions {
  const env = loadEnv();
  return {
    httpOnly: true,
    secure: env.NODE_ENV === "production" || env.COOKIE_SECURE === "true" || env.COOKIE_SAMESITE === "none",
    sameSite: env.COOKIE_SAMESITE,
    maxAge: env.SESSION_TTL_SECONDS * 1000,
    path: "/",
  };
}

export function setSession(response: Response, user: AuthenticatedUser) {
  const env = loadEnv();
  const token = jwt.sign({ nombre: user.nombre, correo: user.correo, rol: user.rol }, env.SESSION_SECRET, {
    subject: String(user.id),
    expiresIn: env.SESSION_TTL_SECONDS,
    issuer: "dpm-sas-api",
    audience: "dpm-sas-web",
  });
  response.cookie(env.COOKIE_NAME, token, options());
}

export function clearSession(response: Response) {
  const env = loadEnv();
  response.clearCookie(env.COOKIE_NAME, options());
}

export function verifySession(token: string): AuthenticatedUser {
  const env = loadEnv();
  const claims = jwt.verify(token, env.SESSION_SECRET, { issuer: "dpm-sas-api", audience: "dpm-sas-web" }) as SessionClaims;
  const id = Number(claims.sub);
  if (!Number.isInteger(id) || !claims.nombre || !claims.correo || !claims.rol) throw new Error("Invalid session claims");
  return { id, nombre: claims.nombre, correo: claims.correo, rol: claims.rol };
}
