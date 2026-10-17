import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, FileText, Calculator, Check, X } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { calcularPrecio } from "@/lib/precio";
import type { Cotizacion, Equipo } from "@/types";
import { FRECUENCIAS, TIPOS_VEGETACION, type EstadoCotizacion } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { EstadoCotizacionBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatCOP, formatFecha } from "@/lib/utils";

export function Cotizaciones() {
  const { cotizaciones, clientes, actualizarEstadoCotizacion } = useApp();
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<EstadoCotizacion | "todos">("todos");
  const [cotizacionActiva, setCotizacionActiva] = useState<Cotizacion | null>(null);

  const nombreCliente = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "Cliente";

  const filtradas = useMemo(() => {
    return cotizaciones
      .filter((c) => (filtroEstado === "todos" ? true : c.estado === filtroEstado))
      .filter((c) => {
        const texto = `${c.zonaNombre} ${nombreCliente(c.clienteId)}`.toLowerCase();
        return texto.includes(busqueda.toLowerCase());
      })
      .sort((a, b) => (a.fechaSolicitud < b.fechaSolicitud ? 1 : -1));
  }, [cotizaciones, filtroEstado, busqueda]);

  return (
    <div className="relative space-y-5">
      <HuTag id="HU-01" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-ink sm:text-2xl">Cotizaciones</h1>
          <p className="text-sm text-muted">Gestiona las solicitudes de clientes y crea nuevas cotizaciones.</p>
        </div>
        <Button asChild>
          <Link to="/app/admin/cotizaciones/nueva">
            <Plus className="size-4" />
            Nueva cotización
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <Input
              placeholder="Buscar por cliente o predio..."
              className="pl-10"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <Select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as EstadoCotizacion | "todos")}
            className="sm:w-56"
          >
            <option value="todos">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="enviada">Enviada</option>
            <option value="aceptada">Aceptada</option>
            <option value="rechazada">Rechazada</option>
          </Select>
        </CardContent>
      </Card>

      {filtradas.length === 0 ? (
        <EmptyState icon={FileText} title="No se encontraron cotizaciones" description="Ajusta la búsqueda o el filtro de estado." />
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line text-left text-xs font-medium uppercase tracking-wide text-muted">
                  <th className="px-5 py-3">Cliente / Predio</th>
                  <th className="px-5 py-3">Detalle</th>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3 text-right">Precio</th>
                  <th className="px-5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtradas.map((c) => (
                  <tr
                    key={c.id}
                    className={cn(
                      "border-b border-line last:border-0",
                      c.estado === "pendiente" && c.origen === "cliente" && "bg-soft/60",
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink">{nombreCliente(c.clienteId)}</p>
                      <p className="text-xs text-muted">{c.zonaNombre}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">
                      {TIPOS_VEGETACION[c.tipoVegetacion]} · {FRECUENCIAS[c.frecuencia]} ·{" "}
                      {c.areaM2.toLocaleString("es-CO")} m²
                    </td>
                    <td className="px-5 py-3.5 text-xs text-muted">{formatFecha(c.fechaSolicitud)}</td>
                    <td className="px-5 py-3.5">
                      <EstadoCotizacionBadge estado={c.estado} />
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-ink">
                      {c.precio !== null ? formatCOP(c.precio) : "—"}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {c.estado === "pendiente" && (
                        <Button size="sm" variant="secondary" onClick={() => setCotizacionActiva(c)}>
                          <Calculator className="size-3.5" />
                          Calcular y enviar
                        </Button>
                      )}
                      {c.estado === "enviada" && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => actualizarEstadoCotizacion(c.id, "aceptada")}
                          >
                            <Check className="size-3.5" />
                            Aceptar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => actualizarEstadoCotizacion(c.id, "rechazada")}
                          >
                            <X className="size-3.5" />
                            Rechazar
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <DialogCalcularPrecio
        cotizacion={cotizacionActiva}
        onClose={() => setCotizacionActiva(null)}
        onEnviar={(precio, equipos, numeroOperarios) => {
          if (!cotizacionActiva) return;
          actualizarEstadoCotizacion(cotizacionActiva.id, "enviada", precio, undefined);
          void equipos;
          void numeroOperarios;
          setCotizacionActiva(null);
        }}
      />
    </div>
  );
}

function DialogCalcularPrecio({
  cotizacion,
  onClose,
  onEnviar,
}: {
  cotizacion: Cotizacion | null;
  onClose: () => void;
  onEnviar: (precio: number, equipos: Equipo[], numeroOperarios: number) => void;
}) {
  const desglose = cotizacion
    ? calcularPrecio({
        areaM2: cotizacion.areaM2,
        tipoVegetacion: cotizacion.tipoVegetacion,
        frecuencia: cotizacion.frecuencia,
        numeroOperarios: cotizacion.numeroOperarios,
        equipos: cotizacion.equipos,
      })
    : null;

  return (
    <Dialog open={!!cotizacion} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        {cotizacion && desglose && (
          <>
            <DialogHeader>
              <DialogTitle>Calcular precio de cotización</DialogTitle>
              <DialogDescription>{cotizacion.zonaNombre}</DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-2 rounded-[var(--radius-btn)] bg-app-bg p-4 text-sm">
              <FilaDesglose etiqueta="Área × tarifa × factores" valor={formatCOP(desglose.subtotalArea)} />
              <FilaDesglose etiqueta="Costo de personal" valor={formatCOP(desglose.costoPersonal)} />
              <FilaDesglose etiqueta="Costo de equipos" valor={formatCOP(desglose.costoEquipos)} />
              <div className="my-1 h-px bg-line" />
              <FilaDesglose etiqueta="Total" valor={formatCOP(desglose.total)} destacado />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <Button onClick={() => onEnviar(desglose.total, cotizacion.equipos, cotizacion.numeroOperarios)}>
                Enviar cotización al cliente
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FilaDesglose({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <Label className={cn("text-muted", destacado && "text-ink font-semibold")}>{etiqueta}</Label>
      <span className={cn("font-medium text-ink", destacado && "text-base font-semibold text-primary")}>
        {valor}
      </span>
    </div>
  );
}
