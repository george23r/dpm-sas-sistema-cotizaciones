import { NavLink } from "react-router-dom";
import { Sprout } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { NAV_POR_ROL } from "@/components/layout/nav";
import { cn } from "@/lib/utils";

const GRUPOS: Record<string, string> = {
  "/app/admin/panel": "Resumen",
  "/app/admin/cotizaciones": "Comercial",
  "/app/admin/clientes": "Comercial",
  "/app/admin/trabajadores": "Operación",
  "/app/admin/programacion": "Operación",
  "/app/admin/cuadrillas": "Operación",
  "/app/admin/reportes": "Control",
  "/app/admin/jornadas": "Control",
};

export function Sidebar() {
  const { rol } = useApp();
  if (!rol) return null;
  const items = NAV_POR_ROL[rol];
  return (
    <aside className="hidden w-[248px] shrink-0 border-r border-line/80 bg-surface/80 md:flex md:flex-col">
      <div className="flex items-center gap-3 border-b border-line/70 px-6 py-5">
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm">
          <Sprout className="size-4.5" />
        </span>
        <div>
          <p className="font-heading text-sm font-bold tracking-tight text-ink">DPM Operations</p>
          <p className="text-[11px] text-muted">Gestión de zonas verdes</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="Navegación principal">
        {items.map((item, index) => {
          const grupo = rol === "administrador" ? GRUPOS[item.to] ?? "Módulos" : "Espacio de trabajo";
          const grupoAnterior = index > 0 ? (rol === "administrador" ? GRUPOS[items[index - 1].to] ?? "Módulos" : "Espacio de trabajo") : "";
          const mostrarGrupo = grupo !== grupoAnterior;
          return (
            <div key={item.to}>
              {mostrarGrupo && <p className="mb-2 mt-4 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted first:mt-0">{grupo}</p>}
              <NavLink
                to={item.to}
                className={({ isActive }) => cn(
                  "group flex items-center gap-3 rounded-[var(--radius-btn)] px-3 py-2.5 text-[13px] font-medium transition-all",
                  isActive ? "bg-soft text-primary shadow-[inset_3px_0_0_var(--color-primary)]" : "text-muted hover:bg-app-bg hover:text-ink",
                )}
              >
                <item.icon className="size-[17px] shrink-0 transition-transform group-hover:scale-105" />
                {item.label}
              </NavLink>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-line/70 px-5 py-4 text-[11px] leading-relaxed text-muted">
        <p className="font-medium text-ink">Operación en contexto</p>
        <p>Los datos visibles dependen de tu rol y de las autorizaciones de la API.</p>
      </div>
    </aside>
  );
}
