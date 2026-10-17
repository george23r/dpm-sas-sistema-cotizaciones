import { useState } from "react";
import { Users2, UserCog, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import type { OrdenTrabajo } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EstadoOrdenBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatFecha } from "@/lib/utils";

export function Cuadrillas() {
  const { cuadrillas, ordenes, clientes, asignarCuadrillaAOrden } = useApp();
  const [ordenActiva, setOrdenActiva] = useState<OrdenTrabajo | null>(null);
  const [errorAsignacion, setErrorAsignacion] = useState<string | null>(null);

  const nombreCliente = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "Cliente";

  const ordenesPendientes = ordenes
    .filter((o) => o.estado !== "finalizado")
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  const haySolape = (aInicio: string, aFin: string, bInicio: string, bFin: string) =>
    aInicio < bFin && bInicio < aFin;

  const estaOcupada = (cuadrillaId: string, orden: OrdenTrabajo) =>
    ordenes.some(
      (o) =>
        o.id !== orden.id &&
        o.cuadrillaId === cuadrillaId &&
        o.fecha === orden.fecha &&
        o.estado !== "finalizado" &&
        haySolape(o.horaInicio, o.horaFin, orden.horaInicio, orden.horaFin),
    );

  const onAsignar = (cuadrillaId: string) => {
    if (!ordenActiva) return;
    const resultado = asignarCuadrillaAOrden(ordenActiva.id, cuadrillaId);
    if (!resultado.ok) {
      setErrorAsignacion(resultado.error);
      return;
    }
    setErrorAsignacion(null);
    setOrdenActiva(null);
  };

  return (
    <div className="relative space-y-5">
      <HuTag id="HU-04" />
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink sm:text-2xl">Asignar cuadrilla</h1>
        <p className="text-sm text-muted">Consulta la disponibilidad del día y asigna cuadrillas a las órdenes.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cuadrillas.map((c) => (
          <Card key={c.id}>
            <CardContent className="flex items-center gap-3.5 p-4">
              <span className="flex size-11 items-center justify-center rounded-xl bg-soft text-primary">
                <Users2 className="size-5" />
              </span>
              <div className="flex-1">
                <p className="font-heading text-sm font-semibold text-ink">{c.nombre}</p>
                <p className="flex items-center gap-1 text-xs text-muted">
                  <UserCog className="size-3" />
                  {c.encargado} · {c.integrantes} integrantes
                </p>
              </div>
              <Badge variant={c.disponibleHoy ? "finalizado" : "inactivo"}>
                {c.disponibleHoy ? "Disponible hoy" : "Ocupada hoy"}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Órdenes por asignar o en curso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ordenesPendientes.length === 0 ? (
            <EmptyState icon={Users2} title="No hay órdenes pendientes de asignación" />
          ) : (
            ordenesPendientes.map((orden) => (
              <div
                key={orden.id}
                className="flex flex-col gap-3 rounded-[var(--radius-btn)] border border-line p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-ink">{orden.tipoServicio}</p>
                    <EstadoOrdenBadge estado={orden.estado} />
                  </div>
                  <p className="text-xs text-muted">
                    {nombreCliente(orden.clienteId)} · {orden.zonaNombre} · {formatFecha(orden.fecha)} ·{" "}
                    {orden.horaInicio}-{orden.horaFin}
                  </p>
                  <p className="text-xs text-muted">
                    Cuadrilla asignada:{" "}
                    <span className="font-medium text-ink">
                      {cuadrillas.find((c) => c.id === orden.cuadrillaId)?.nombre ?? "Sin asignar"}
                    </span>
                  </p>
                </div>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setErrorAsignacion(null);
                    setOrdenActiva(orden);
                  }}
                >
                  Asignar cuadrilla
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={!!ordenActiva} onOpenChange={(open) => !open && setOrdenActiva(null)}>
        <DialogContent>
          {ordenActiva && (
            <>
              <DialogHeader>
                <DialogTitle>Asignar cuadrilla</DialogTitle>
                <DialogDescription>
                  {ordenActiva.tipoServicio} · {formatFecha(ordenActiva.fecha)} · {ordenActiva.horaInicio}-
                  {ordenActiva.horaFin}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-4 space-y-2">
                {cuadrillas.map((c) => {
                  const ocupada = estaOcupada(c.id, ordenActiva);
                  const esActual = ordenActiva.cuadrillaId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      disabled={ocupada}
                      onClick={() => onAsignar(c.id)}
                      className={cn(
                        "flex w-full items-center justify-between rounded-[var(--radius-btn)] border p-3.5 text-left transition-colors",
                        ocupada
                          ? "cursor-not-allowed border-line bg-app-bg opacity-60"
                          : "border-line hover:border-primary hover:bg-soft",
                        esActual && "border-primary bg-soft",
                      )}
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{c.nombre}</p>
                        <p className="text-xs text-muted">{c.encargado} · {c.integrantes} integrantes</p>
                      </div>
                      {esActual ? (
                        <Badge variant="primary">
                          <CheckCircle2 className="size-3" />
                          Asignada
                        </Badge>
                      ) : ocupada ? (
                        <Badge variant="inactivo">Ocupada en este horario</Badge>
                      ) : (
                        <Badge variant="finalizado">Disponible</Badge>
                      )}
                    </button>
                  );
                })}
              </div>

              {errorAsignacion && (
                <p className="mt-3 flex items-start gap-2 rounded-[var(--radius-btn)] bg-status-error-bg px-3 py-2.5 text-sm text-status-error">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  {errorAsignacion}
                </p>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
