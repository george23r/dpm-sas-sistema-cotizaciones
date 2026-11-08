import bcrypt from "bcryptjs";
import { HttpError } from "../../shared/errors.js";
import type { AuthenticatedUser } from "../../shared/types.js";
import { findActiveUserByEmail, findActiveUserById } from "./auth.repository.js";

export function publicUser(user: AuthenticatedUser): AuthenticatedUser {
  return user;
}

export async function authenticateCredentials(email: string, password: string): Promise<AuthenticatedUser> {
  const user = await findActiveUserByEmail(email);
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new HttpError(401, "INVALID_CREDENTIALS", "Correo o contraseña incorrectos.");
  }
  return { id: user.id, nombre: user.nombre, correo: user.correo, rol: user.rol };
}

export async function refreshUserFromDatabase(user: AuthenticatedUser): Promise<AuthenticatedUser> {
  const current = await findActiveUserById(user.id);
  if (!current) throw new HttpError(401, "SESSION_REVOKED", "La cuenta está inactiva o ya no existe.");
  return { id: current.id, nombre: current.nombre, correo: current.correo, rol: current.rol };
}
