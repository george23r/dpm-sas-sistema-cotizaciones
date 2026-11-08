import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Users,
  Leaf,
  History,
  ClipboardList,
  ClipboardCheck,
  BarChart3,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import type { Rol } from "@/types";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export const NAV_POR_ROL: Record<Rol, NavItem[]> = {
  cliente: [
    { to: "/app/cliente/zonas", label: "Mis zonas verdes", icon: Leaf },
    { to: "/app/cliente/cotizaciones", label: "Mis cotizaciones", icon: FileText },
    { to: "/app/cliente/historial", label: "Historial de servicios", icon: History },
  ],
  administrador: [
    { to: "/app/admin/panel", label: "Panel de control", icon: LayoutDashboard },
    { to: "/app/admin/cotizaciones", label: "Cotizaciones", icon: FileText },
    { to: "/app/admin/clientes", label: "Clientes", icon: UserRoundCheck },
    { to: "/app/admin/trabajadores", label: "Trabajadores", icon: Users },
    { to: "/app/admin/programacion", label: "Programación", icon: CalendarDays },
    { to: "/app/admin/cuadrillas", label: "Cuadrillas", icon: Users },
    { to: "/app/admin/reportes", label: "Reportes", icon: BarChart3 },
    { to: "/app/admin/jornadas", label: "Jornadas y conciliación", icon: ClipboardCheck },
  ],
  operario: [{ to: "/app/operario/ordenes", label: "Mis órdenes", icon: ClipboardList }],
};

export const RUTA_INICIAL_POR_ROL: Record<Rol, string> = {
  cliente: "/app/cliente/zonas",
  administrador: "/app/admin/panel",
  operario: "/app/operario/ordenes",
};
