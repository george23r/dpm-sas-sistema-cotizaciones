import type { RolUsuario } from "./user-role.js";

export interface AuthenticatedUser {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}
