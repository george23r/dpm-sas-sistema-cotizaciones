import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, MapPin, PlayCircle, CalendarCheck, RefreshCw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { finalizarOrdenApi, iniciarOrdenApi, obtenerOrdenApi, type OrdenApi } from "@/api/operaciones";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EstadoOrdenBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { formatFecha } from "@/lib/utils";
import type { OrdenTrabajo } from "@/types";

export function DetalleOrden() {
  const { id } = useParams<{ id: string }>(); const navigate = useNavigate(); const { ordenes: demoOrders, cambiarEstadoOrden, finalizarOrden, modoDemo } = useApp(); const [apiOrder, setApiOrder] = useState<OrdenApi | null>(null); const [nota, setNota] = useState(""); const [error, setError] = useState<string | null>(null); const [saving, setSaving] = useState(false);
  useEffect(() => { if (modoDemo || !id) return; setSaving(true); obtenerOrdenApi(Number(id)).then((result) => setApiOrder(result.data)).catch((reason: Error) => setError(reason.message)).finally(() => setSaving(false)); }, [id, modoDemo]);
  const demoOrder = demoOrders.find((order) => order.id === id); const order: OrdenTrabajo | OrdenApi | undefined = modoDemo ? demoOrder : apiOrder ?? undefined;
  if (!order) return <div className="mx-auto max-w-2xl space-y-5"><Back /><p className="text-sm text-muted">{saving ? "Consultando la orden…" : error ?? "No se encontró la orden solicitada."}</p></div>;
  const state = orderState(order); const finished = state === "finalizado" || state === "finalizada";
  const start = async () => { setSaving(true); setError(null); try { if (modoDemo) cambiarEstadoOrden(String(order.id), "en_ejecucion"); else setApiOrder((await iniciarOrdenApi(Number(order.id))).data); } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible iniciar la orden."); } finally { setSaving(false); } };
  const finish = async () => { setSaving(true); setError(null); try { if (modoDemo) finalizarOrden(String(order.id), { nota: nota.trim() || undefined }); else setApiOrder((await finalizarOrdenApi(Number(order.id), nota.trim() || undefined)).data); } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible finalizar la orden."); } finally { setSaving(false); } };
  return <div className="mx-auto max-w-2xl space-y-5"><HuTag id="HU-06" /><Back /><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Orden de trabajo</p><h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">{orderService(order)}</h1><p className="mt-1.5 text-sm text-muted">Confirma cada cambio de estado con el servidor.</p></div><Card><CardContent className="space-y-4 p-5"><div className="flex items-center justify-between gap-2"><EstadoOrdenBadge estado={state === "finalizada" ? "finalizado" : state} /><span className="text-xs text-muted">{orderClient(order)}</span></div><div className="space-y-3 text-sm"><p className="flex items-center gap-2 text-ink"><MapPin className="size-4 text-muted" /> {orderAddress(order)}</p><p className="flex items-center gap-2 text-ink"><Clock className="size-4 text-muted" /> {orderDate(order)} · {orderTime(order)}</p><p className="text-muted">Zona: <strong className="text-ink">{orderZone(order)}</strong></p></div></CardContent></Card>{error && <div className="rounded-xl border border-status-error/20 bg-status-error-bg px-4 py-3 text-sm text-status-error" role="alert">{error}</div>}{finished ? <Card><CardContent className="space-y-3 p-6 text-center"><CheckCircle2 className="mx-auto size-10 text-primary" /><h2 className="font-heading text-xl font-semibold text-ink">Servicio finalizado</h2><p className="text-sm text-muted">El cierre quedó registrado por la API.</p><Button className="w-full" onClick={() => navigate("/app/operario/ordenes")}>Volver a mis órdenes</Button></CardContent></Card> : state === "pendiente" ? <Button size="lg" className="h-14 w-full text-base" onClick={() => void start()} disabled={saving}><PlayCircle className="size-5" /> {saving ? "Registrando…" : "Iniciar servicio"}</Button> : <Card><CardContent className="space-y-4 p-5"><Label htmlFor="nota">Nota de finalización (opcional)</Label><Textarea id="nota" placeholder="Describe novedades de ejecución, si aplica." value={nota} onChange={(event) => setNota(event.target.value)} /><Button size="lg" className="h-14 w-full text-base" onClick={() => void finish()} disabled={saving}><CalendarCheck className="size-5" /> {saving ? "Registrando…" : "Finalizar servicio"}</Button></CardContent></Card>}{saving && <p className="flex items-center justify-center gap-2 text-xs text-muted"><RefreshCw className="size-3.5 animate-spin" /> Sincronizando con la API…</p>}</div>;
}
function Back() { const navigate = useNavigate(); return <button type="button" onClick={() => navigate("/app/operario/ordenes")} className="flex items-center gap-1.5 text-sm font-medium text-muted"><ArrowLeft className="size-4" /> Mis órdenes</button>; }
function orderState(order: OrdenTrabajo | OrdenApi): "pendiente" | "en_ejecucion" | "finalizado" | "finalizada" { return "estado" in order ? order.estado : "pendiente"; }
function orderService(order: OrdenTrabajo | OrdenApi) { return "tipoServicio" in order ? order.tipoServicio : order.tipo_servicio; }
function orderClient(order: OrdenTrabajo | OrdenApi) { return "cliente" in order ? order.cliente : "Servicio asignado"; }
function orderZone(order: OrdenTrabajo | OrdenApi) { return "zonaNombre" in order ? order.zonaNombre : order.zona; }
function orderAddress(order: OrdenTrabajo | OrdenApi) { return order.direccion ?? "Dirección no registrada"; }
function orderDate(order: OrdenTrabajo | OrdenApi) { return "fecha" in order ? formatFecha(order.fecha) : formatFecha(order.inicio.slice(0, 10)); }
function orderTime(order: OrdenTrabajo | OrdenApi) { return "horaInicio" in order ? `${order.horaInicio} - ${order.horaFin}` : `${order.inicio.slice(11, 16)} - ${order.fin.slice(11, 16)}`; }
