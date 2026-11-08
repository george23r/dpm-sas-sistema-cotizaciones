import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, ChevronRight, ClipboardList, RefreshCw } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { obtenerMisOrdenesApi, type OrdenApi } from "@/api/operaciones";
import { Card, CardContent } from "@/components/ui/card";
import { EstadoOrdenBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import type { OrdenTrabajo } from "@/types";

const COLOR_BORDE: Record<string, string> = { pendiente: "border-l-status-pending", en_ejecucion: "border-l-status-progress", finalizado: "border-l-status-done", finalizada: "border-l-status-done" };
type OrderRow = OrdenTrabajo | OrdenApi;

export function MisOrdenes() {
  const { ordenes: demoOrders, cuadrillaActualId, modoDemo } = useApp();
  const navigate = useNavigate();
  const [apiOrders, setApiOrders] = useState<OrdenApi[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadOrders = useCallback(async () => {
    if (modoDemo) return;
    setLoading(true);
    setError(null);
    try {
      const result = await obtenerMisOrdenesApi();
      setApiOrders(result.data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "No fue posible consultar tus Ã³rdenes.");
    } finally {
      setLoading(false);
    }
  }, [modoDemo]);
  useEffect(() => { void loadOrders(); }, [loadOrders]);
  const orders: OrderRow[] = modoDemo ? demoOrders.filter((order) => order.cuadrillaId === cuadrillaActualId) : apiOrders;
  const sorted = [...orders].sort((a, b) => orderStart(a).localeCompare(orderStart(b)));
  return <div className="mx-auto max-w-2xl space-y-5"><HuTag id="HU-05" /><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Trabajo de campo</p><h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">Mis Ã³rdenes</h1><p className="mt-1.5 text-sm text-muted">Servicios asignados a tu cuadrilla, con acciones seguras desde el mÃ³vil.</p></div>{error && <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-status-error/20 bg-status-error-bg px-4 py-3 text-sm text-status-error" role="alert"><span>No fue posible actualizar tus Ã³rdenes: {error}</span><button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-status-error/30 bg-white px-3 font-semibold text-status-error hover:bg-status-error-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-error" onClick={() => void loadOrders()}><RefreshCw className="size-4" /> Reintentar</button></div>}{loading && <div role="status" aria-live="polite" className="flex items-center gap-2 rounded-xl bg-soft px-4 py-3 text-sm text-primary"><RefreshCw className="size-4 animate-spin" /> Consultando la agenda asignadaâ€¦</div>}{!sorted.length && !loading ? <EmptyState icon={ClipboardList} title="No tienes Ã³rdenes asignadas" description="Las Ã³rdenes aparecen cuando el servidor las asigna a tu cuadrilla." /> : <div className="space-y-3">{sorted.map((order) => <Card key={String(order.id)} className={cn("border-l-4 transition-all hover:shadow-md", COLOR_BORDE[orderState(order)])}><button type="button" className="block w-full text-left active:scale-[0.995]" onClick={() => navigate(`/app/operario/ordenes/${order.id}`)}><CardContent className="flex items-center gap-3 p-4 sm:p-5"><div className="min-w-0 flex-1 space-y-2"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-heading text-base font-semibold text-ink">{orderService(order)}</p><EstadoOrdenBadge estado={orderState(order) === "finalizada" ? "finalizado" : orderState(order) as "pendiente" | "en_ejecucion" | "finalizado"} /></div><p className="flex items-center gap-1.5 text-sm text-muted"><MapPin className="size-4 shrink-0" /> <span className="truncate">{orderAddress(order)}</span></p><p className="flex items-center gap-1.5 text-sm text-muted"><Clock className="size-4 shrink-0" /> {orderDate(order)} Â· {orderTime(order)}</p></div><ChevronRight aria-hidden="true" className="size-5 shrink-0 text-muted" /></CardContent></button></Card>)}</div>}</div>;
}
function orderState(order: OrderRow): "pendiente" | "en_ejecucion" | "finalizado" | "finalizada" { return "estado" in order ? order.estado : "pendiente"; }
function orderService(order: OrderRow) { return "tipoServicio" in order ? order.tipoServicio : order.tipo_servicio; }
function orderAddress(order: OrderRow) { return order.direccion ?? "DirecciÃ³n no registrada"; }
function orderStart(order: OrderRow) { return "fecha" in order ? `${order.fecha}T${order.horaInicio}` : order.inicio; }
function orderDate(order: OrderRow) { return orderStart(order).slice(0, 10); }
function orderTime(order: OrderRow) { return "horaInicio" in order ? `${order.horaInicio} - ${order.horaFin}` : `${order.inicio.slice(11, 16)} - ${order.fin.slice(11, 16)}`; }

