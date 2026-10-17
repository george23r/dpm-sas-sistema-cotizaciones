import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, CheckCircle2, PlayCircle, User, CalendarCheck } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EstadoOrdenBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { formatFecha } from "@/lib/utils";

export function DetalleOrden() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ordenes, cambiarEstadoOrden, finalizarOrden, operarioActualNombre } = useApp();
  const [nota, setNota] = useState("");
  const [confirmado, setConfirmado] = useState(false);

  const orden = ordenes.find((o) => o.id === id);

  if (!orden) {
    return (
      <div className="space-y-4">
        <BotonVolver />
        <p className="text-sm text-muted">No se encontró la orden solicitada.</p>
      </div>
    );
  }

  if (confirmado || (orden.estado === "finalizado" && orden.finalizacion)) {
    return (
      <div className="relative mx-auto max-w-md space-y-5 py-6 text-center">
        <HuTag id="HU-06" />
        <BotonVolver />
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-soft text-primary">
          <CheckCircle2 className="size-8" />
        </div>
        <div>
          <h1 className="font-heading text-xl font-semibold text-ink">Servicio finalizado</h1>
          <p className="mt-1 text-sm text-muted">
            Registrado el {orden.finalizacion ? formatFecha(orden.finalizacion.fecha) : ""} a las{" "}
            {orden.finalizacion?.hora} por {orden.finalizacion?.responsable}.
          </p>
          {orden.finalizacion?.nota && (
            <p className="mt-2 rounded-[var(--radius-btn)] bg-app-bg p-3 text-left text-sm text-ink">
              "{orden.finalizacion.nota}"
            </p>
          )}
        </div>
        <Button className="w-full" onClick={() => navigate("/app/operario/ordenes")}>
          Volver a mis órdenes
        </Button>
      </div>
    );
  }

  const onFinalizar = () => {
    finalizarOrden(orden.id, { nota: nota.trim() || undefined });
    setConfirmado(true);
  };

  return (
    <div className="relative space-y-5">
      <HuTag id="HU-06" />
      <BotonVolver />

      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-heading text-lg font-semibold text-ink">{orden.tipoServicio}</h1>
            <EstadoOrdenBadge estado={orden.estado} />
          </div>

          <div className="space-y-2.5 text-sm">
            <p className="flex items-center gap-2 text-ink">
              <MapPin className="size-4 shrink-0 text-muted" />
              {orden.direccion}
            </p>
            <p className="flex items-center gap-2 text-ink">
              <Clock className="size-4 shrink-0 text-muted" />
              {formatFecha(orden.fecha)} · {orden.horaInicio} - {orden.horaFin}
            </p>
            <p className="flex items-center gap-2 text-ink">
              <User className="size-4 shrink-0 text-muted" />
              Responsable en turno: {operarioActualNombre}
            </p>
          </div>
        </CardContent>
      </Card>

      {orden.estado === "en_ejecucion" && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <Label htmlFor="nota">Nota de finalización (opcional)</Label>
            <Textarea
              id="nota"
              placeholder="Ej. Servicio completado sin novedades."
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {orden.estado === "pendiente" && (
        <Button size="lg" className="h-14 w-full text-base" onClick={() => cambiarEstadoOrden(orden.id, "en_ejecucion")}>
          <PlayCircle className="size-5" />
          Iniciar servicio
        </Button>
      )}

      {orden.estado === "en_ejecucion" && (
        <Button size="lg" className="h-14 w-full text-base" onClick={onFinalizar}>
          <CalendarCheck className="size-5" />
          Marcar como finalizado
        </Button>
      )}
    </div>
  );
}

function BotonVolver() {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => navigate("/app/operario/ordenes")}
      className="flex items-center gap-1.5 text-sm font-medium text-muted"
    >
      <ArrowLeft className="size-4" />
      Mis órdenes
    </button>
  );
}
