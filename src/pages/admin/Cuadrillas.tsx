import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays, CheckCircle2, Users2 } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { asignarCuadrillaApi, obtenerCuadrillasApi, obtenerOrdenesApi, type CuadrillaApi, type OrdenApi } from "@/api/operaciones";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { EstadoOrdenBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { EmptyState } from "@/components/shared/EmptyState";
import type { Cuadrilla, OrdenTrabajo } from "@/types";

type TeamRow = Cuadrilla | CuadrillaApi; type OrderRow = OrdenTrabajo | OrdenApi;

export function Cuadrillas() {
  const { cuadrillas: demoTeams, ordenes: demoOrders, modoDemo, asignarCuadrillaAOrden } = useApp();
  const [teams, setTeams] = useState<CuadrillaApi[]>([]); const [orders, setOrders] = useState<OrdenApi[]>([]); const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState<number | null>(null);
  useEffect(() => { if (modoDemo) return; let active = true; Promise.all([obtenerCuadrillasApi(), obtenerOrdenesApi()]).then(([teamResult, orderResult]) => { if (active) { setTeams(teamResult.data); setOrders(orderResult.data); setError(null); } }).catch((reason: Error) => { if (active) setError(reason.message); }); return () => { active = false; }; }, [modoDemo]);
  const teamRows: TeamRow[] = modoDemo ? demoTeams : teams; const orderRows: OrderRow[] = modoDemo ? demoOrders.filter((order) => order.estado !== "finalizado") : orders.filter((order) => order.estado !== "finalizada");
  const assign = async (order: OrderRow, value: string) => { const teamId = value ? Number(value) : null; setSaving(Number(order.id)); setError(null); if (modoDemo) { const result = asignarCuadrillaAOrden(String(order.id), value); if (!result.ok) setError(result.error); setSaving(null); return; } try { await asignarCuadrillaApi(Number(order.id), teamId); const updated = await obtenerOrdenesApi(); setOrders(updated.data); } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible asignar la cuadrilla."); } finally { setSaving(null); } };

  return <div className="space-y-7"><HuTag id="HU-04" /><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Recursos operativos</p><h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">Cuadrillas</h1><p className="mt-1.5 text-sm text-muted">Integrantes, capacidad registrada y asignaciones de servicio.</p></div>{error && <div className="flex items-start gap-2 rounded-xl border border-status-error/20 bg-status-error-bg px-4 py-3 text-sm text-status-error" role="alert"><AlertTriangle className="mt-0.5 size-4" />{error}</div>}
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{teamRows.map((team) => <Card key={String(team.id)}><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><span className="flex size-11 items-center justify-center rounded-xl bg-soft text-primary"><Users2 className="size-5" /></span><Badge variant={"activa" in team && !team.activa ? "inactivo" : "finalizado"}>{"activa" in team && !team.activa ? "Inactiva" : "Activa"}</Badge></div><h2 className="mt-5 font-heading text-base font-semibold text-ink">{team.nombre}</h2><p className="mt-1 text-sm text-muted">{teamInfo(team)}</p><div className="mt-4 flex items-center gap-2 text-xs text-muted"><CheckCircle2 className="size-3.5 text-primary" /> Disponibilidad basada en órdenes asignadas</div></CardContent></Card>)}</div>
    <Card><CardHeader><CardTitle>Asignaciones y próximos servicios</CardTitle><p className="mt-1 text-sm text-muted">El servidor valida la cuadrilla y los cruces de horario al guardar.</p></CardHeader><CardContent>{orderRows.length ? <div className="space-y-3">{orderRows.map((order) => <div key={String(order.id)} className="grid gap-3 rounded-xl border border-line p-4 lg:grid-cols-[1fr_auto_auto] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-ink">{orderService(order)}</p><Status order={order} /></div><p className="mt-1 text-xs text-muted">{orderClient(order)} · {orderZone(order)} · {orderTime(order)}</p></div><div className="flex items-center gap-2 text-xs text-muted"><CalendarDays className="size-4" /> {orderDate(order)}</div><Select className="h-10 min-w-48" value={String("cuadrillaId" in order ? order.cuadrillaId ?? "" : order.cuadrilla_id ?? "")} onChange={(event) => void assign(order, event.target.value)} disabled={saving === Number(order.id)} aria-label={`Asignar cuadrilla para ${orderService(order)}`}><option value="">Sin asignar</option>{teamRows.map((team) => <option key={String(team.id)} value={String(team.id)}>{team.nombre}</option>)}</Select></div>)}</div> : <EmptyState icon={Users2} title="No hay órdenes pendientes de asignación" description="Las órdenes aparecen aquí cuando provienen de una cotización aceptada." />}</CardContent></Card>
    <div className="rounded-xl border border-line bg-surface px-4 py-3 text-xs leading-5 text-muted"><strong className="text-ink">Nota de alcance:</strong> el esquema actual permite validar un líder activo por cuadrilla, pero la edición de integrantes y permisos administrativos aún requiere endpoints CRUD específicos y validación con DPM.</div>
  </div>;
}

function teamInfo(team: TeamRow) { return "servicios_proximos" in team ? `${team.integrantes_activos} activos · ${team.servicios_proximos} servicios próximos` : `${team.integrantes} integrantes · Responsable: ${team.encargado}`; }
function orderService(order: OrderRow) { return "tipoServicio" in order ? order.tipoServicio : order.tipo_servicio; }
function orderClient(order: OrderRow) { return "cliente" in order ? order.cliente : "Cliente"; }
function orderZone(order: OrderRow) { return "zonaNombre" in order ? order.zonaNombre : order.zona; }
function orderDate(order: OrderRow) { return ("fecha" in order ? order.fecha : order.inicio).slice(0, 10); }
function orderTime(order: OrderRow) { return "horaInicio" in order ? `${order.horaInicio}–${order.horaFin}` : `${order.inicio.slice(11, 16)}–${order.fin.slice(11, 16)}`; }
function Status({ order }: { order: OrderRow }) { const state = "estado" in order ? order.estado : "pendiente"; return <EstadoOrdenBadge estado={state === "finalizada" ? "finalizado" : state} />; }
