import { useNavigate } from "react-router-dom";
import { Sprout, LogOut, Tag } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { Rol } from "@/types";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { RUTA_INICIAL_POR_ROL } from "@/components/layout/nav";

const ROL_LABEL: Record<Rol, string> = {
  cliente: "Cliente",
  administrador: "Administrador",
  operario: "Operario",
};

const ROL_INICIALES: Record<Rol, string> = {
  cliente: "LA",
  administrador: "AD",
  operario: "LG",
};

export function TopBar() {
  const { rol, setRol, mostrarHU, alternarHU, cerrarSesion } = useApp();
  const navigate = useNavigate();

  const cambiarRol = (nuevoRol: Rol) => {
    setRol(nuevoRol);
    navigate(RUTA_INICIAL_POR_ROL[nuevoRol]);
  };

  const salir = () => {
    cerrarSesion();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-line bg-surface/95 px-4 backdrop-blur-sm sm:px-6">
      <div className="flex items-center gap-2 font-heading text-lg font-semibold text-primary">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-white">
          <Sprout className="size-4.5" />
        </span>
        <span className="hidden sm:inline">DPM SAS</span>
      </div>

      <div className="ml-auto flex items-center gap-2 sm:gap-3">
        <label className="hidden items-center gap-2 md:flex">
          <span className="text-xs font-medium text-muted">Ver como:</span>
          <Select
            value={rol}
            onChange={(e) => cambiarRol(e.target.value as Rol)}
            className="h-9 w-40 text-sm"
            aria-label="Selector de rol de demostración"
          >
            <option value="cliente">Cliente</option>
            <option value="administrador">Administrador</option>
            <option value="operario">Operario</option>
          </Select>
        </label>

        <Select
          value={rol}
          onChange={(e) => cambiarRol(e.target.value as Rol)}
          className="h-9 w-[7.5rem] text-xs md:hidden"
          aria-label="Selector de rol de demostración"
        >
          <option value="cliente">Cliente</option>
          <option value="administrador">Admin</option>
          <option value="operario">Operario</option>
        </Select>

        <Button
          variant={mostrarHU ? "secondary" : "ghost"}
          size="icon"
          className="hidden sm:flex"
          onClick={alternarHU}
          title={mostrarHU ? "Ocultar etiquetas HU" : "Mostrar etiquetas HU"}
        >
          <Tag className="size-4" />
        </Button>

        <Separador />

        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>{ROL_INICIALES[rol]}</AvatarFallback>
          </Avatar>
          <div className="hidden leading-tight lg:block">
            <p className="text-sm font-medium text-ink">{ROL_LABEL[rol]}</p>
            <p className="text-xs text-muted">Modo demostración</p>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={salir} title="Cerrar sesión">
          <LogOut className="size-4" />
        </Button>
      </div>
    </header>
  );
}

function Separador() {
  return <span className="hidden h-6 w-px bg-line sm:block" />;
}
