import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, FileText, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { obtenerCotizacionesApi, type CotizacionApi } from "@/api/cotizaciones";
import { ESTADOS_COTIZACION, type Cotizacion, type EstadoCotizacion } from "@/types";
import { cotizacionVigente, consecutivoCotizacion, fechaVencimiento } from "@/lib/cotizaciones";
import { formatCOP, formatFecha } from "@/lib/utils";
import { EstadoCotizacionBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export function Cotizaciones() {
  const { cotizaciones, clientes, modoDemo } = useApp();
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoCotizacion | "todos">("todos");
  const [apiData, setApiData] = useState<CotizacionApi[] | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (modoDemo) return;
    let activo = true;
    setCargando(true);
    obtenerCotizacionesApi(estado === "todos" ? {} : { estado })
      .then((response) => { if (activo) { setApiData(response.data); setApiError(null); } })
      .catch((error: Error) => { if (activo) setApiError(error.message); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [estado, modoDemo]);

  const listaDemo = useMemo(() => cotizaciones.filter((c) => (estado === "todos" || c.estado === estado) && [c.objeto, c.zonaNombre, clientes.find((x) => x.id === c.clienteId)?.nombre].join(" ").toLowerCase().includes(busqueda.toLowerCase())).sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud)), [cotizaciones, clientes, busqueda, estado]);
  const listaApi = useMemo(() => (apiData ?? []).filter((c) => [c.objeto, c.zona, c.cliente].join(" ").toLowerCase().includes(busqueda.toLowerCase())), [apiData, busqueda]);

  return (
    <div className="space-y-7">
      <HuTag id="HU-01" />
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">Proceso comercial</p><h1 className="font-heading text-3xl font-semibold tracking-tight text-ink">Cotizaciones</h1><p className="mt-1.5 text-sm text-muted">Consulta, prepara y da seguimiento a propuestas individuales.</p></div><Button asChild><Link to="/app/admin/cotizaciones/nueva"><Plus className="size-4" /> Nueva cotización</Link></Button></div>
      {!modoDemo && apiError && <div className="rounded-xl border border-status-error/20 bg-status-error-bg px-4 py-3 text-sm text-status-error" role="alert">No fue posible consultar la API: {apiError}</div>}
      <div className="grid gap-3 sm:grid-cols-[1fr_220px_auto]"><div className="relative"><Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" /><Input className="h-11 pl-10" placeholder="Buscar cliente, zona u objeto" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} /></div><Select className="h-11" value={estado} onChange={(e) => setEstado(e.target.value as EstadoCotizacion | "todos")} aria-label="Filtrar por estado"><option value="todos">Todos los estados</option>{Object.entries(ESTADOS_COTIZACION).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</Select><Button variant="outline" className="hidden sm:flex"><SlidersHorizontal className="size-4" /> Filtros</Button></div>
      {modoDemo ? <DemoTable lista={listaDemo} clientes={clientes} /> : <ApiTable lista={listaApi} cargando={cargando} />}
      <p className="text-xs text-muted">{modoDemo ? "Modo demostración: los datos se mantienen en memoria." : "Fuente: API REST de DPM. Los costos internos no forman parte de esta vista."}</p>
    </div>
  );
}

function DemoTable({ lista, clientes }: { lista: Cotizacion[]; clientes: { id: string; nombre: string }[] }) { return <Card><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase tracking-wide text-muted"><th className="p-4">Cotización / cliente</th><th className="p-4">Objeto</th><th className="p-4">Vigencia</th><th className="p-4">Estado</th><th className="p-4 text-right">Total</th><th className="p-4" /></tr></thead><tbody>{lista.map((c) => <tr key={c.id} className="border-b border-line/70 last:border-0 hover:bg-app-bg/60"><td className="p-4"><p className="font-semibold text-ink">{consecutivoCotizacion(c.id)}</p><p className="mt-0.5 text-xs text-muted">{clientes.find((x) => x.id === c.clienteId)?.nombre ?? "Cliente"}</p></td><td className="p-4"><p className="font-medium text-ink">{c.objeto}</p><p className="mt-0.5 text-xs text-muted">{c.zonaNombre}</p></td><td className="p-4 text-muted">{fechaVencimiento(c) ? formatFecha(fechaVencimiento(c)!) : "—"}</td><td className="p-4"><EstadoCotizacionBadge estado={c.estado} /></td><td className="p-4 text-right font-semibold text-ink">{c.precio === null ? "Por elaborar" : formatCOP(c.precio)}</td><td className="p-4">{["solicitada", "borrador"].includes(c.estado) ? <Button asChild variant="outline" size="sm"><Link to={`/app/admin/cotizaciones/editar/${c.id}`}>Elaborar</Link></Button> : c.estado === "enviada" ? <span className="text-xs text-muted">{cotizacionVigente(c) ? "Esperando respuesta" : "Vencida"}</span> : <ArrowUpRight className="size-4 text-muted" />}</td></tr>)}</tbody></table>{!lista.length && <Empty text="No hay cotizaciones para los filtros seleccionados." />}</div></Card>; }

function ApiTable({ lista, cargando }: { lista: CotizacionApi[]; cargando: boolean }) { return <Card><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-line text-xs uppercase tracking-wide text-muted"><th className="p-4">Cotización / cliente</th><th className="p-4">Objeto</th><th className="p-4">Solicitada</th><th className="p-4">Estado</th><th className="p-4 text-right">Total</th><th className="p-4" /></tr></thead><tbody>{cargando ? <tr><td colSpan={6} className="p-8 text-center text-muted">Consultando cotizaciones…</td></tr> : lista.map((c) => <tr key={c.id} className="border-b border-line/70 last:border-0 hover:bg-app-bg/60"><td className="p-4"><p className="font-semibold text-ink">{c.consecutivo}</p><p className="mt-0.5 text-xs text-muted">{c.cliente}</p></td><td className="p-4"><p className="font-medium text-ink">{c.objeto}</p><p className="mt-0.5 text-xs text-muted">{c.zona}</p></td><td className="p-4 text-muted">{formatFecha(c.solicitada_en.slice(0, 10))}</td><td className="p-4"><EstadoCotizacionBadge estado={c.estado} /></td><td className="p-4 text-right font-semibold text-ink">{c.total === null ? "Por elaborar" : formatCOP(Number(c.total))}</td><td className="p-4"><FileText className="size-4 text-muted" aria-label="Detalle disponible por API" /></td></tr>)}</tbody></table>{!cargando && !lista.length && <Empty text="La API no devolvió cotizaciones para estos filtros." />}</div></Card>; }
function Empty({ text }: { text: string }) { return <p className="p-8 text-center text-sm text-muted">{text}</p>; }
