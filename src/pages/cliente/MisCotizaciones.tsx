import { Link } from "react-router-dom";
import { Plus, FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { FRECUENCIAS, TIPOS_VEGETACION } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EstadoCotizacionBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatCOP, formatFecha } from "@/lib/utils";

export function MisCotizaciones() {
  const { cotizaciones, clienteActualId } = useApp();
  const misCotizaciones = cotizaciones
    .filter((c) => c.clienteId === clienteActualId)
    .sort((a, b) => (a.fechaSolicitud < b.fechaSolicitud ? 1 : -1));

  return (
    <div className="relative space-y-5">
      <HuTag id="HU-02" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-xl font-semibold text-ink sm:text-2xl">Mis cotizaciones</h1>
          <p className="text-sm text-muted">Consulta el estado de tus solicitudes y el precio calculado.</p>
        </div>
        <Button asChild>
          <Link to="/app/cliente/cotizaciones/nueva">
            <Plus className="size-4" />
            Nueva solicitud
          </Link>
        </Button>
      </div>

      {misCotizaciones.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No tienes cotizaciones todavía"
          description="Solicita tu primera cotización desde tus zonas verdes."
          action={
            <Button asChild variant="secondary">
              <Link to="/app/cliente/cotizaciones/nueva">Solicitar cotización</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-3">
          {misCotizaciones.map((c) => (
            <Card key={c.id}>
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-heading text-sm font-semibold text-ink">{c.zonaNombre}</p>
                    <EstadoCotizacionBadge estado={c.estado} />
                  </div>
                  <p className="text-xs text-muted">
                    {TIPOS_VEGETACION[c.tipoVegetacion]} · {FRECUENCIAS[c.frecuencia]} ·{" "}
                    {c.areaM2.toLocaleString("es-CO")} m² · Solicitada el {formatFecha(c.fechaSolicitud)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted">Precio</p>
                  <p className="font-heading text-lg font-semibold text-ink">
                    {c.precio !== null ? formatCOP(c.precio) : "Por calcular"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
