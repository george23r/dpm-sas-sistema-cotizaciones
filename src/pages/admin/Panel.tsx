import { Link } from "react-router-dom";
import { Clock, CalendarCheck2, Loader2, Activity, ArrowRight } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HuTag } from "@/components/shared/HuTag";
import { formatFecha } from "@/lib/utils";

const HOY = "2026-10-17";
const EN_7_DIAS = "2026-10-24";

export function Panel() {
  const { cotizaciones, ordenes, clientes } = useApp();

  const pendientes = cotizaciones.filter((c) => c.estado === "solicitada" || c.estado === "borrador");
  const estaSemana = ordenes.filter((o) => o.fecha >= HOY && o.fecha <= EN_7_DIAS);
  const enEjecucion = ordenes.filter((o) => o.estado === "en_ejecucion");

  const actividad = [...ordenes]
    .filter((o) => o.estado === "finalizado")
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
    .slice(0, 5);

  const nombreCliente = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "Cliente";

  return (
    <div className="relative space-y-6">
      <HuTag id="HU-Panel" />
      <div>
        <h1 className="font-heading text-xl font-semibold text-ink sm:text-2xl">Panel de control</h1>
        <p className="text-sm text-muted">Resumen operativo de cotizaciones y servicios.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/app/admin/cotizaciones">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-status-pending-bg text-status-pending">
                <Clock className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold text-ink">{pendientes.length}</p>
                <p className="text-sm text-muted">Cotizaciones pendientes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/admin/programacion">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-soft text-primary">
                <CalendarCheck2 className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold text-ink">{estaSemana.length}</p>
                <p className="text-sm text-muted">Servicios esta semana</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/app/admin/programacion">
          <Card className="h-full transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-4 p-5">
              <span className="flex size-11 items-center justify-center rounded-xl bg-status-progress-bg text-status-progress">
                <Loader2 className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold text-ink">{enEjecucion.length}</p>
                <p className="text-sm text-muted">Servicios en ejecución</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="size-4 text-primary" />
            Actividad reciente
          </CardTitle>
          <Link to="/app/admin/programacion" className="flex items-center gap-1 text-xs font-medium text-primary">
            Ver todo <ArrowRight className="size-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="space-y-3">
          {actividad.length === 0 ? (
            <p className="text-sm text-muted">Sin actividad reciente registrada.</p>
          ) : (
            actividad.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                <div className="space-y-0.5">
                  <p className="text-sm font-medium text-ink">
                    {o.tipoServicio} · {nombreCliente(o.clienteId)}
                  </p>
                  <p className="text-xs text-muted">{o.zonaNombre} · {formatFecha(o.fecha)}</p>
                </div>
                <span
                  className={
                    "text-xs font-medium text-status-done"
                  }
                >
                  Finalizado
                </span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
