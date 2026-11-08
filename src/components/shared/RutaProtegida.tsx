import { Navigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import type { Rol } from "@/types";
import { RUTA_INICIAL_POR_ROL } from "@/components/layout/nav";

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { autenticado, authCargando } = useApp();
  if (authCargando) {
    return <div className="flex min-h-svh items-center justify-center text-sm text-muted">Verificando sesión…</div>;
  }
  if (!autenticado) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RutaDeRol({ rolRequerido, children }: { rolRequerido: Rol; children: React.ReactNode }) {
  const { rol } = useApp();
  if (!rol) return <Navigate to="/login" replace />;
  if (rol !== rolRequerido) return <Navigate to={RUTA_INICIAL_POR_ROL[rol]} replace />;
  return <>{children}</>;
}
