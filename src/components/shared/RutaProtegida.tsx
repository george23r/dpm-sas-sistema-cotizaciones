import { Navigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import type { Rol } from "@/types";
import { RUTA_INICIAL_POR_ROL } from "@/components/layout/nav";

export function RutaProtegida({ children }: { children: React.ReactNode }) {
  const { autenticado } = useApp();
  if (!autenticado) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function RutaDeRol({ rolRequerido, children }: { rolRequerido: Rol; children: React.ReactNode }) {
  const { rol } = useApp();
  if (rol !== rolRequerido) return <Navigate to={RUTA_INICIAL_POR_ROL[rol]} replace />;
  return <>{children}</>;
}
