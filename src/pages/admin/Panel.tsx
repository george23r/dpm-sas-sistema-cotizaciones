import { Link } from "react-router-dom";
import { ArrowUpRight, CalendarDays, CheckCircle2, Clock3, FileText, MoreHorizontal, PlayCircle, Plus, Users } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EstadoCotizacionBadge, EstadoOrdenBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { formatCOP, formatFecha } from "@/lib/utils";

export function Panel() {
  const { cotizaciones, ordenes, clientes, cuadrillas } = useApp();
  const pendientes = cotizaciones.filter((c) => c.estado === "solicitada" || c.estado === "borrador");
  const enviadas = cotizaciones.filter((c) => c.estado === "enviada");
  const aceptadas = cotizaciones.filter((c) => c.estado === "aceptada");
  const finalizadas = ordenes.filter((o) => o.estado === "finalizado");
  const activas = ordenes.filter((o) => o.estado === "en_ejecucion");
  const nombreCliente = (id: string) => clientes.find((c) => c.id === id)?.nombre ?? "Cliente sin nombre";
  const siguientes = [...ordenes].sort((a, b) => `${a.fecha}${a.horaInicio}`.localeCompare(`${b.fecha}${b.horaInicio}`)).slice(0, 4);
  const actividad = [...cotizaciones].sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud)).slice(0, 4);

  const metricas = [
    { label: "Por revisar", value: pendientes.length, detail: "solicitudes o borradores", icon: Clock3, tone: "bg-amber-50 text-amber-700", to: "/app/admin/cotizaciones" },
    { label: "Enviadas", value: enviadas.length, detail: "esperando respuesta", icon: FileText, tone: "bg-sky-50 text-sky-700", to: "/app/admin/cotizaciones" },
    { label: "Aceptadas", value: aceptadas.length, detail: "listas para programar", icon: CheckCircle2, tone: "bg-soft text-primary", to: "/app/admin/programacion" },
    { label: "En ejecución", value: activas.length, detail: "servicios activos", icon: PlayCircle, tone: "bg-violet-50 text-violet-700", to: "/app/admin/programacion" },
  ] as const;

  return (
    <div className="space-y-7">
      <HuTag id="HU-Panel" />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Centro de operaciones</p><h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">Buenos días, equipo DPM</h1><p className="mt-1.5 text-sm text-muted">Una vista clara de lo que necesita atención hoy.</p></div><Button asChild><Link to="/app/admin/cotizaciones/nueva"><Plus className="size-4" /> Nueva cotización</Link></Button></div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metricas.map(({ label, value, detail, icon: Icon, tone, to }) => <Link to={to} key={label}><Card className="h-full transition-all hover:-translate-y-0.5 hover:shadow-md"><CardContent className="flex items-start justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mt-3 font-heading text-3xl font-semibold tracking-tight text-ink">{value}</p><p className="mt-1 text-xs text-muted">{detail}</p></div><span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" /></span></CardContent></Card></Link>)}</div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Próximos servicios</CardTitle><p className="mt-1 text-sm text-muted">Agenda operativa disponible en el prototipo.</p></div><Link to="/app/admin/programacion" className="flex items-center gap-1 text-xs font-semibold text-primary">Ver agenda <ArrowUpRight className="size-3.5" /></Link></CardHeader><CardContent><div className="divide-y divide-line/70">{siguientes.length ? siguientes.map((o) => <div key={o.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0"><div className="flex size-11 shrink-0 flex-col items-center justify-center rounded-xl bg-soft text-primary"><span className="text-[10px] font-bold uppercase">{o.fecha.slice(5, 7)}/{o.fecha.slice(8, 10)}</span><CalendarDays className="mt-0.5 size-3.5" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{o.tipoServicio}</p><p className="truncate text-xs text-muted">{nombreCliente(o.clienteId)} · {o.horaInicio}–{o.horaFin}</p></div><EstadoOrdenBadge estado={o.estado} /></div>) : <Empty text="No hay servicios programados." />}</div></CardContent></Card>

        <Card><CardHeader><CardTitle>Disponibilidad de cuadrillas</CardTitle><p className="mt-1 text-sm text-muted">Estado registrado en el contexto actual.</p></CardHeader><CardContent className="space-y-4">{cuadrillas.length ? cuadrillas.slice(0, 4).map((c) => <div key={c.id} className="flex items-center gap-3"><span className={`size-2.5 rounded-full ${c.disponibleHoy ? "bg-primary" : "bg-amber-500"}`} /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{c.nombre}</p><p className="text-xs text-muted">{c.integrantes} integrantes · {c.disponibleHoy ? "Disponible" : "Con agenda"}</p></div><Users className="size-4 text-muted" /></div>) : <Empty text="No hay cuadrillas registradas." />}</CardContent></Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
        <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Actividad reciente</CardTitle><MoreHorizontal className="size-4 text-muted" /></CardHeader><CardContent className="space-y-4">{actividad.length ? actividad.map((c) => <div key={c.id} className="flex items-start gap-3"><span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-app-bg"><FileText className="size-3.5 text-primary" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{c.objeto}</p><p className="text-xs text-muted">{nombreCliente(c.clienteId)} · {formatFecha(c.fechaSolicitud)}</p></div><EstadoCotizacionBadge estado={c.estado} /></div>) : <Empty text="Sin actividad reciente registrada." />}</CardContent></Card>
        <Card><CardHeader><CardTitle>Resumen del periodo visible</CardTitle><p className="mt-1 text-sm text-muted">Valores derivados de la información disponible.</p></CardHeader><CardContent className="grid grid-cols-2 gap-3"><Summary label="Servicios finalizados" value={finalizadas.length} /><Summary label="Clientes registrados" value={clientes.length} /><Summary label="Valor aceptado" value={formatCOP(aceptadas.reduce((total, c) => total + (c.precio ?? 0), 0))} /><Summary label="Órdenes totales" value={ordenes.length} /></CardContent></Card>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: number | string }) { return <div className="rounded-xl bg-app-bg p-4"><p className="text-xs text-muted">{label}</p><p className="mt-2 font-heading text-xl font-semibold text-ink">{value}</p></div>; }
function Empty({ text }: { text: string }) { return <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">{text}</p>; }
