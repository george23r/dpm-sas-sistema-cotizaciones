import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, AlertTriangle, ArrowUpRight, CalendarDays, CheckCircle2, Clock3, FileText, Plus, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { obtenerCotizacionesApi, type CotizacionApi } from "@/api/cotizaciones";
import { obtenerClientesApi, type ClienteApi } from "@/api/catalogos";
import { obtenerCuadrillasApi, obtenerOrdenesApi, obtenerResumenOperativoApi, type CuadrillaApi, type OrdenApi, type ResumenOperativoApi } from "@/api/operaciones";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EstadoCotizacionBadge, EstadoOrdenBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { formatFecha } from "@/lib/utils";
import type { Cotizacion, Cuadrilla, OrdenTrabajo } from "@/types";

type QuoteRow = Cotizacion | CotizacionApi;
type OrderRow = OrdenTrabajo | OrdenApi;

export function Panel() {
  const { cotizaciones, ordenes, clientes, cuadrillas, modoDemo } = useApp();
  const [clienteId, setClienteId] = useState("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [apiQuotes, setApiQuotes] = useState<CotizacionApi[]>([]);
  const [apiOrders, setApiOrders] = useState<OrdenApi[]>([]);
  const [apiTeams, setApiTeams] = useState<CuadrillaApi[]>([]);
  const [apiClients, setApiClients] = useState<ClienteApi[]>([]);
  const [apiSummary, setApiSummary] = useState<ResumenOperativoApi | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (modoDemo) return;
    let active = true;
    setLoading(true);
    Promise.all([obtenerCotizacionesApi({ pageSize: 100 }), obtenerOrdenesApi(), obtenerCuadrillasApi(), obtenerClientesApi(), obtenerResumenOperativoApi({ desde: desde || undefined, hasta: hasta || undefined, clienteId: clienteId === "todos" ? undefined : Number(clienteId) })])
      .then(([quotes, orders, teams, clients, summary]) => { if (active) { setApiQuotes(quotes.data); setApiOrders(orders.data); setApiTeams(teams.data); setApiClients(clients.data); setApiSummary(summary.data); setApiError(null); } })
      .catch((error: Error) => { if (active) setApiError(error.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [clienteId, desde, hasta, modoDemo]);

  const quoteRows: QuoteRow[] = modoDemo ? cotizaciones : apiQuotes;
  const orderRows: OrderRow[] = modoDemo ? ordenes : apiOrders;
  const teamRows: Array<Cuadrilla | CuadrillaApi> = modoDemo ? cuadrillas : apiTeams;
  const clientRows = modoDemo ? clientes : apiClients;
  const inPeriod = (date: string) => (!desde || date.slice(0, 10) >= desde) && (!hasta || date.slice(0, 10) <= hasta);
  const inClient = (id: string | number) => clienteId === "todos" || String(id) === clienteId;
  const quotes = quoteRows.filter((quote) => inPeriod("fechaSolicitud" in quote ? quote.fechaSolicitud : quote.solicitada_en) && inClient("clienteId" in quote ? quote.clienteId : quote.cliente_id));
  const orders = orderRows.filter((order) => inPeriod(orderStart(order)) && inClient("clienteId" in order ? order.clienteId : order.cliente_id));
  const sent = quotes.filter((quote) => quote.estado === "enviada");
  const accepted = quotes.filter((quote) => quote.estado === "aceptada");
  const scheduled = orders.filter((order) => orderState(order) === "pendiente");
  const finished = orders.filter((order) => orderState(order) === "finalizado" || orderState(order) === "finalizada");
  const active = orders.filter((order) => orderState(order) === "en_ejecucion");
  const quoteSummary = modoDemo ? { solicitadas: quotes.filter((quote) => quote.estado === "solicitada").length, enviadas: sent.length, aceptadas: accepted.length, pendientes_respuesta: sent.length } : apiSummary?.cotizaciones;
  const orderSummary = modoDemo ? { programadas: scheduled.length, en_ejecucion: active.length, finalizadas: finished.length } : apiSummary?.ordenes;
  const upcoming = [...orders].sort((a, b) => orderStart(a).localeCompare(orderStart(b))).slice(0, 5);
  const recent = [...quotes].sort((a, b) => quoteDate(b).localeCompare(quoteDate(a))).slice(0, 5);
  const conflicts = orders.filter((order, index, all) => all.some((other, otherIndex) => otherIndex > index && orderOverlap(order, other)));
  const metrics: Array<[string, number, LucideIcon, string]> = [
    ["Solicitadas", quoteSummary?.solicitadas ?? 0, Clock3, "text-amber-700 bg-amber-50"],
    ["Enviadas", quoteSummary?.enviadas ?? 0, FileText, "text-sky-700 bg-sky-50"],
    ["Aceptadas", quoteSummary?.aceptadas ?? 0, CheckCircle2, "text-primary bg-soft"],
    ["Programados", orderSummary?.programadas ?? 0, CalendarDays, "text-violet-700 bg-violet-50"],
    ["Finalizados", orderSummary?.finalizadas ?? 0, CheckCircle2, "text-slate-700 bg-slate-100"],
    ["En ejecución", orderSummary?.en_ejecucion ?? 0, Activity, "text-indigo-700 bg-indigo-50"],
  ];
  const clientName = (id: string | number) => clientRows.find((client) => String(client.id) === String(id))?.nombre ?? (typeof id === "number" ? `Cliente #${id}` : "Cliente");

  return <div className="space-y-7">
    <HuTag id="HU-Panel" />
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Centro de operaciones</p><h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">Vista operativa</h1><p className="mt-1.5 text-sm text-muted">Cotizaciones, servicios y capacidad de cuadrillas en un mismo contexto.</p></div><Button asChild><Link to="/app/admin/cotizaciones/nueva"><Plus className="size-4" /> Nueva cotización</Link></Button></div>
    <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-3"><label className="text-xs font-semibold text-muted">Cliente<Select className="mt-1.5 h-10" value={clienteId} onChange={(event) => setClienteId(event.target.value)}><option value="todos">Todos los clientes</option>{clientRows.map((client) => <option key={client.id} value={client.id}>{client.nombre}</option>)}</Select></label><label className="text-xs font-semibold text-muted">Desde<Input className="mt-1.5 h-10" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} /></label><label className="text-xs font-semibold text-muted">Hasta<Input className="mt-1.5 h-10" type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} /></label></CardContent></Card>
    {apiError && <div className="rounded-xl border border-status-error/20 bg-status-error-bg px-4 py-3 text-sm text-status-error" role="alert">No fue posible actualizar el centro de operaciones: {apiError}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">{metrics.map(([label, value, icon, tone]) => <Metric key={label} label={label} value={value} icon={icon} tone={tone} />)}</div>
    <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]"><Card><CardHeader className="flex-row items-start justify-between"><div><CardTitle>Actividad temporal</CardTitle><p className="mt-1 text-sm text-muted">Registros por fecha en el periodo filtrado.</p></div><Activity className="size-5 text-primary" /></CardHeader><CardContent><ActivityChart quotes={quotes} orders={orders} activity={apiSummary?.actividad} loading={loading} /></CardContent></Card><Card><CardHeader><CardTitle>Alertas operativas</CardTitle><p className="mt-1 text-sm text-muted">Requieren revisión antes de continuar.</p></CardHeader><CardContent className="space-y-3">{conflicts.length ? <Alert text={`${conflicts.length} posible${conflicts.length === 1 ? "" : "s"} cruce de horario detectado`} to="/app/admin/programacion" /> : <div className="rounded-xl border border-dashed border-line p-5 text-center"><CheckCircle2 className="mx-auto size-5 text-primary" /><p className="mt-2 text-sm font-medium text-ink">Sin cruces visibles</p><p className="mt-1 text-xs text-muted">La validación definitiva corresponde al servidor.</p></div>}{(quoteSummary?.pendientes_respuesta ?? 0) > 0 && <Alert text={`${quoteSummary?.pendientes_respuesta} cotización${quoteSummary?.pendientes_respuesta === 1 ? "" : "es"} pendiente${quoteSummary?.pendientes_respuesta === 1 ? "" : "s"} de respuesta`} to="/app/admin/cotizaciones" />}</CardContent></Card></div>
    <div className="grid gap-5 xl:grid-cols-[1.25fr_0.75fr]"><Card><CardHeader className="flex-row items-center justify-between"><div><CardTitle>Próximos mantenimientos</CardTitle><p className="mt-1 text-sm text-muted">Servicios programados y en ejecución.</p></div><Link to="/app/admin/programacion" className="text-xs font-semibold text-primary">Abrir agenda <ArrowUpRight className="inline size-3.5" /></Link></CardHeader><CardContent className="divide-y divide-line/70">{upcoming.length ? upcoming.map((order) => <div key={String(order.id)} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft text-primary"><CalendarDays className="size-4" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{orderService(order)}</p><p className="truncate text-xs text-muted">{orderZone(order)} · {clientName("clienteId" in order ? order.clienteId : order.cliente_id)}</p></div><StatusOrder order={order} /></div>) : <Empty text="No hay mantenimientos en el periodo." />}</CardContent></Card><Card><CardHeader><CardTitle>Disponibilidad de cuadrillas</CardTitle><p className="mt-1 text-sm text-muted">Capacidad registrada, sin inferir disponibilidad futura.</p></CardHeader><CardContent className="space-y-4">{teamRows.length ? teamRows.slice(0, 5).map((team) => <div key={String(team.id)} className="flex items-center gap-3"><span className="size-2.5 rounded-full bg-primary" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{team.nombre}</p><p className="text-xs text-muted">{teamInfo(team)}</p></div><Users className="size-4 text-muted" /></div>) : <Empty text="La API aún no devolviÃ³ cuadrillas." />}</CardContent></Card></div>
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]"><Card><CardHeader><CardTitle>Actividad reciente</CardTitle></CardHeader><CardContent className="space-y-4">{recent.length ? recent.map((quote) => <div key={String(quote.id)} className="flex items-start gap-3"><span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-lg bg-app-bg"><FileText className="size-3.5 text-primary" /></span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-ink">{quote.objeto}</p><p className="text-xs text-muted">{clientName("clienteId" in quote ? quote.clienteId : quote.cliente_id)} · {formatFecha(quoteDate(quote))}</p></div><StatusQuote quote={quote} /></div>) : <Empty text="Sin actividad reciente." />}</CardContent></Card><Card><CardHeader><CardTitle>Accesos rápidos</CardTitle><p className="mt-1 text-sm text-muted">Tareas frecuentes del equipo administrador.</p></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2"><Quick to="/app/admin/cotizaciones/nueva" icon={FileText} text="Preparar cotización" /><Quick to="/app/admin/programacion" icon={CalendarDays} text="Revisar agenda" /><Quick to="/app/admin/jornadas" icon={Activity} text="Comparar jornadas" /><Quick to="/app/admin/cuadrillas" icon={Users} text="Gestionar cuadrillas" /><div className="col-span-full mt-2 rounded-xl bg-app-bg p-4 text-xs leading-5 text-muted"><strong className="text-ink">Datos:</strong> {modoDemo ? "modo demostración en memoria" : "consulta API activa"}. No hay ingresos, tendencias o rendimientos calculados sin un dato respaldado.</div></CardContent></Card></div>
  </div>;
}

function orderStart(order: OrderRow) { return "fecha" in order ? `${order.fecha}T${order.horaInicio}` : order.inicio; }
function orderEnd(order: OrderRow) { return "fecha" in order ? `${order.fecha}T${order.horaFin}` : order.fin; }
function orderState(order: OrderRow): "pendiente" | "en_ejecucion" | "finalizado" | "finalizada" { return "estado" in order ? order.estado : "pendiente"; }
function orderService(order: OrderRow) { return "tipoServicio" in order ? order.tipoServicio : order.tipo_servicio; }
function orderZone(order: OrderRow) { return "zonaNombre" in order ? order.zonaNombre : order.zona; }
function orderOverlap(a: OrderRow, b: OrderRow) { const teamA = "cuadrillaId" in a ? a.cuadrillaId : a.cuadrilla_id; const teamB = "cuadrillaId" in b ? b.cuadrillaId : b.cuadrilla_id; return teamA !== null && teamA === teamB && orderStart(a) < orderEnd(b) && orderEnd(a) > orderStart(b); }
function quoteDate(quote: QuoteRow) { return ("fechaSolicitud" in quote ? quote.fechaSolicitud : quote.solicitada_en).slice(0, 10); }
function teamInfo(team: Cuadrilla | CuadrillaApi) { return "servicios_proximos" in team ? `${team.integrantes} integrantes · ${team.servicios_proximos} próximos` : `${team.integrantes} integrantes`; }
function Metric({ label, value, icon: Icon, tone }: { label: string; value: number; icon: LucideIcon; tone: string }) { return <Card><CardContent className="flex items-start justify-between p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p><p className="mt-3 font-heading text-3xl font-semibold text-ink">{value}</p><p className="mt-1 text-xs text-muted">En filtros activos</p></div><span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}><Icon className="size-5" /></span></CardContent></Card>; }
function ActivityChart({ quotes, orders, activity, loading }: { quotes: QuoteRow[]; orders: OrderRow[]; activity?: Array<{ fecha: string; total: number }>; loading: boolean }) { const points = useMemo(() => activity?.length ? activity.map((item) => [item.fecha, Number(item.total)] as [string, number]) : (() => { const counts = new Map<string, number>(); [...quotes.map(quoteDate), ...orders.map((order) => orderStart(order).slice(0, 10))].forEach((date) => counts.set(date, (counts.get(date) ?? 0) + 1)); return [...counts.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-8); })(), [activity, quotes, orders]); if (loading) return <div className="h-40 animate-pulse rounded-xl bg-app-bg" />; if (!points.length) return <Empty text="No hay suficientes datos para graficar actividad." />; const max = Math.max(...points.map(([, value]) => value)); return <div className="flex h-44 items-end gap-2 border-b border-line pb-1">{points.map(([date, value]) => <div key={date} className="flex min-w-0 flex-1 flex-col items-center gap-2"><span className="text-[10px] font-semibold text-muted">{value}</span><div className="w-full rounded-t-lg bg-primary/80 transition-all" style={{ height: `${Math.max(12, (value / max) * 112)}px` }} title={`${value} registros el ${date}`} /><span className="text-[10px] text-muted">{date.slice(5)}</span></div>)}</div>; }
function StatusQuote({ quote }: { quote: QuoteRow }) { return <EstadoCotizacionBadge estado={quote.estado} />; }
function StatusOrder({ order }: { order: OrderRow }) { const state = orderState(order); if (state === "finalizada") return <span className="text-xs text-muted">Finalizado</span>; return <EstadoOrdenBadge estado={state} />; }
function Alert({ text, to }: { text: string; to: string }) { return <Link to={to} className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-800"><AlertTriangle className="size-4 shrink-0" /><span className="flex-1">{text}</span><ArrowUpRight className="size-4" /></Link>; }
function Quick({ to, icon: Icon, text }: { to: string; icon: LucideIcon; text: string }) { return <Link to={to} className="flex items-center gap-3 rounded-xl border border-line p-3 text-sm font-medium text-ink transition-colors hover:border-primary/30 hover:bg-soft"><Icon className="size-4 text-primary" />{text}<ArrowUpRight className="ml-auto size-3.5 text-muted" /></Link>; }
function Empty({ text }: { text: string }) { return <p className="rounded-xl border border-dashed border-line p-5 text-center text-sm text-muted">{text}</p>; }



