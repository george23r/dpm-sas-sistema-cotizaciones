import { useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, LogOut, Tag } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Rol } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { RUTA_INICIAL_POR_ROL, NAV_POR_ROL } from "@/components/layout/nav";

const ROL_LABEL: Record<Rol, string> = { cliente: "Cliente", administrador: "Administrador", operario: "Operario" };
const ROL_INICIALES: Record<Rol, string> = { cliente: "CL", administrador: "AD", operario: "OP" };

export function TopBar() {
  const { rol, setRol, usuarioActual, mostrarHU, alternarHU, cerrarSesion, modoDemo } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const current = rol ? NAV_POR_ROL[rol].find((item) => location.pathname.startsWith(item.to)) : undefined;

  const cambiarRol = (nuevoRol: Rol) => { setRol(nuevoRol); navigate(RUTA_INICIAL_POR_ROL[nuevoRol]); };
  const salir = async () => { await cerrarSesion(); navigate("/login"); };

  return (
    <header className="sticky top-0 z-40 flex min-h-[72px] items-center gap-4 border-b border-line/80 bg-surface/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="flex items-center gap-2 md:hidden">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white"><span className="text-sm font-bold">D</span></span>
          <span className="font-heading text-sm font-bold text-ink">DPM</span>
        </div>
        {current && <div className="hidden min-w-0 items-center gap-2 md:flex">
          <span className="text-xs font-medium text-muted">Workspace</span><ChevronRight className="size-3.5 text-muted/70" />
          <span className="truncate font-heading text-sm font-semibold text-ink">{current.label}</span>
        </div>}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {modoDemo && rol && <label className="hidden items-center gap-2 md:flex"><span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Demo</span><Select value={rol} onChange={(e) => cambiarRol(e.target.value as Rol)} className="h-9 w-36 text-xs" aria-label="Selector de rol de demostración"><option value="cliente">Cliente</option><option value="administrador">Administrador</option><option value="operario">Operario</option></Select></label>}
        <Button variant={mostrarHU ? "secondary" : "ghost"} size="icon" className="hidden sm:flex" onClick={alternarHU} title={mostrarHU ? "Ocultar etiquetas HU" : "Mostrar etiquetas HU"}><Tag className="size-4" /></Button>
        <span className="hidden h-7 w-px bg-line sm:block" />
        <div className="flex items-center gap-2.5">
          <Avatar><AvatarFallback>{rol ? ROL_INICIALES[rol] : "US"}</AvatarFallback></Avatar>
          <div className="hidden leading-tight lg:block"><p className="text-sm font-semibold text-ink">{usuarioActual?.nombre ?? (rol ? ROL_LABEL[rol] : "Usuario")}</p><p className="text-[11px] text-muted">{modoDemo ? "Modo demostración" : usuarioActual?.correo}</p></div>
        </div>
        <Button variant="ghost" size="icon" onClick={salir} title="Cerrar sesión" aria-label="Cerrar sesión"><LogOut className="size-4" /></Button>
      </div>
    </header>
  );
}
