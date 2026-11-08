import { apiFetch } from "./http";
import type { Rol } from "@/types";

const AUTH_BASE = "/api/v1/auth";

export interface UsuarioActual {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
}

interface AuthResponse {
  user?: UsuarioActual;
  usuario?: UsuarioActual;
}

export async function iniciarSesionApi(correo: string, clave: string) {
  const response = await apiFetch<AuthResponse>(`${AUTH_BASE}/login`, {
    method: "POST",
    body: JSON.stringify({ correo, clave }),
  });
  return response.user ?? response.usuario;
}

export async function obtenerUsuarioActual() {
  const response = await apiFetch<AuthResponse | UsuarioActual>(`${AUTH_BASE}/me`);
  if ("rol" in response) return response;
  return response.user ?? response.usuario;
}

export function cerrarSesionApi() {
  return apiFetch<void>(`${AUTH_BASE}/logout`, { method: "POST" });
}
