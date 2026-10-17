import { useNavigate } from "react-router-dom";
import { MapPin, Clock, ChevronRight, ClipboardList } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoOrdenBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatFecha } from "@/lib/utils";

const COLOR_BORDE: Record<string, string> = {
  pendiente: "border-l-status-pending",
  en_ejecucion: "border-l-status-progress",
  finalizado: "border-l-status-done",
  incidencia: "border-l-status-error",
};

export function MisOrdenes() {
  const { ordenes, cuadrillaActualId } = useApp();
  const navigate = useNavigate();

  const misOrdenes = ordenes
    .filter((o) => o.cuadrillaId === cuadrillaActualId)
    .sort((a, b) => (a.fecha + a.horaInicio < b.fecha + b.horaInicio ? -1 : 1));

  return (
    <div className="relative space-y-4">
      <HuTag id="HU-05" />
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink">Mis órdenes</h1>
        <p className="text-sm text-muted">Servicios asignados a tu cuadrilla.</p>
      </div>

      {misOrdenes.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No tienes órdenes asignadas" description="Vuelve a consultar más tarde." />
      ) : (
        <div className="space-y-3">
          {misOrdenes.map((orden) => (
            <Card
              key={orden.id}
              className={cn("cursor-pointer border-l-4 transition-shadow active:shadow-sm", COLOR_BORDE[orden.estado])}
              onClick={() => navigate(`/app/operario/ordenes/${orden.id}`)}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-heading text-base font-semibold text-ink">{orden.tipoServicio}</p>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    <MapPin className="size-4 shrink-0" />
                    <span className="truncate">{orden.direccion}</span>
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-muted">
                    <Clock className="size-4 shrink-0" />
                    {formatFecha(orden.fecha)} · {orden.horaInicio} - {orden.horaFin}
                  </p>
                  <EstadoOrdenBadge estado={orden.estado} />
                </div>
                <ChevronRight className="size-5 shrink-0 text-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
