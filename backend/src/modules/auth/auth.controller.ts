import type { Request, Response } from "express";
import { z } from "zod";
import { clearSession, setSession } from "../../shared/session.js";
import { asyncRoute, HttpError } from "../../shared/errors.js";
import { authenticateCredentials, refreshUserFromDatabase } from "./auth.service.js";

const loginSchema = z.object({
  correo: z.string().trim().email().max(160),
  clave: z.string().min(1).max(200),
});

export const login = asyncRoute(async (request, response) => {
  const input = loginSchema.safeParse(request.body);
  if (!input.success) throw new HttpError(422, "VALIDATION_ERROR", "Los datos de inicio de sesión no son válidos.", input.error.flatten().fieldErrors);
  const user = await authenticateCredentials(input.data.correo, input.data.clave);
  setSession(response, user);
  response.status(200).json({ user });
});

export const me = asyncRoute(async (request: Request, response: Response) => {
  if (!request.user) throw new HttpError(401, "UNAUTHENTICATED", "La sesión es requerida.");
  const user = await refreshUserFromDatabase(request.user);
  response.status(200).json({ user });
});

export const logout = asyncRoute(async (_request, response) => {
  clearSession(response);
  response.status(204).send();
});
