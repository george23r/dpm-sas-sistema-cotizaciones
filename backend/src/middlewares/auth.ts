import type { NextFunction, Request, Response } from "express";
import { loadEnv } from "../config/env.js";
import { HttpError } from "../shared/errors.js";
import { verifySession } from "../shared/session.js";
import type { RolUsuario } from "../shared/user-role.js";

export function authenticate(request: Request, _response: Response, next: NextFunction) {
  const env = loadEnv();
  const token = request.cookies?.[env.COOKIE_NAME] as string | undefined;
  if (!token) return next(new HttpError(401, "UNAUTHENTICATED", "La sesión es requerida."));
  try {
    request.user = verifySession(token);
    return next();
  } catch {
    return next(new HttpError(401, "SESSION_EXPIRED", "La sesión no es válida o ha expirado."));
  }
}

export function requireRole(...roles: RolUsuario[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user) return next(new HttpError(401, "UNAUTHENTICATED", "La sesión es requerida."));
    if (!roles.includes(request.user.rol)) return next(new HttpError(403, "FORBIDDEN", "No tienes permisos para esta operación."));
    return next();
  };
}

export function requireSameOrigin(request: Request, _response: Response, next: NextFunction) {
  const env = loadEnv();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(request.method.toUpperCase());
  const originHeader = request.get("origin");
  const refererHeader = request.get("referer");
  let requestOrigin: string | undefined = originHeader;
  if (!requestOrigin && refererHeader) {
    try { requestOrigin = new URL(refererHeader).origin; } catch { requestOrigin = undefined; }
  }
  if (requestOrigin && requestOrigin !== env.CORS_ORIGIN) return next(new HttpError(403, "CSRF_ORIGIN_REJECTED", "El origen de la solicitud no está permitido."));
  if (isMutation && !requestOrigin) return next(new HttpError(403, "CSRF_ORIGIN_MISSING", "La solicitud de cambio debe indicar un origen permitido."));
  return next();
}

