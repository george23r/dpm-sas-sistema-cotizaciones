import { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, FileText, LockKeyhole } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { obtenerCotizacionApi, responderCotizacionApi, type CotizacionDetalleApi } from "@/api/cotizaciones";
import { useApp } from "@/context/AppContext";
import { ApiError } from "@/api/http";
import { EstadoCotizacionBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCOP, formatFecha } from "@/lib/utils";
import { fechaVencimiento } from "@/lib/cotizaciones";

const TODAY_BOGOTA = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bogota" }).format(new Date());

export function CotizacionDetalle() {
  const { cotizacionId } = useParams<{ cotizacionId: string }>();
  const { rol } = useApp();
  const [quote, setQuote] = useState<CotizacionDetalleApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!cotizacionId) return;
    setLoading(true);
    obtenerCotizacionApi(Number(cotizacionId)).then((result) => { setQuote(result.data); setError(null); }).catch((reason) => setError(reason instanceof ApiError ? reason.message : "No fue posible cargar la cotización.")).finally(() => setLoading(false));
  }, [cotizacionId]);

  async function respond(accept: boolean) {
    if (!quote) return;
    setSaving(true); setError(null); setMessage(null);
    try { await responderCotizacionApi(quote.id, accept); setQuote((current) => current ? { ...current, estado: accept ? "aceptada" : "rechazada" } : current); setMessage(accept ? "Aceptaste la cotización." : "Registramos el rechazo de la cotización."); }
    catch (reason) { setError(reason instanceof ApiError ? reason.message : "No fue posible registrar la respuesta."); }
    finally { setSaving(false); }
  }

  const backPath = rol === "administrador" ? "/app/admin/cotizaciones" : "/app/cliente/cotizaciones";
  if (loading) return <div className="space-y-5"><p className="text-sm text-muted">Cargando detalle de la cotización…</p></div>;
  if (error || !quote) return <div className="space-y-5"><Button asChild variant="ghost"><Link to={backPath}><ArrowLeft className="size-4" /> Volver</Link></Button><p role="alert" className="rounded-xl bg-status-error-bg p-4 text-sm text-status-error">{error ?? "La cotización no está disponible."}</p></div>;

  const vence = fechaVencimiento({ fechaEnvio: quote.enviada_en?.slice(0, 10) ?? null, vigenciaDias: quote.vigencia_dias });
  const canRespond = rol === "cliente" && quote.estado === "enviada" && !!vence && TODAY_BOGOTA <= vence;
  return <div className="space-y-6">
    <HuTag id="HU-01 / HU-02" />
    <Button asChild variant="ghost" className="-ml-3"><Link to={backPath}><ArrowLeft className="size-4" /> Volver a cotizaciones</Link></Button>
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Detalle de propuesta</p><h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight text-ink">{quote.consecutivo}</h1><p className="mt-1 text-sm text-muted">{quote.objeto} · {quote.cliente} · {quote.zona}</p></div><EstadoCotizacionBadge estado={quote.estado} /></div>
    {error && <p role="alert" className="rounded-xl bg-status-error-bg p-4 text-sm text-status-error">{error}</p>}{message && <p role="status" className="rounded-xl bg-soft p-4 text-sm text-primary">{message}</p>}
    <div className="grid gap-5 lg:grid-cols-[1fr_300px]"><div className="space-y-5">
      <Card><CardHeader><CardTitle>Resumen del servicio</CardTitle></CardHeader><CardContent className="space-y-4 text-sm"><Info icon={FileText} label="Objeto" value={quote.objeto} /><Info icon={CalendarDays} label="Solicitada" value={formatFecha(quote.solicitada_en.slice(0, 10))} />{quote.enviada_en && <Info icon={Clock3} label="Vigencia" value={quote.vence_el ? `Hasta ${formatFecha(quote.vence_el)}` : `${quote.vigencia_dias} días desde el envío`} />}<TextBlock label="Alcance" value={quote.alcance} /><TextBlock label="Incluye" value={quote.incluye} /><TextBlock label="Observaciones" value={quote.observaciones} /></CardContent></Card>
      <Card><CardHeader><CardTitle>Conceptos de la propuesta</CardTitle></CardHeader><CardContent>{quote.lineas.length ? <div className="divide-y divide-line">{quote.lineas.map((line) => <div key={line.id} className="flex items-start justify-between gap-4 py-3 text-sm"><div><p className="font-medium text-ink">{line.concepto}</p><p className="text-xs text-muted">{line.cantidad} × {formatCOP(Number(line.valor_unitario))}</p></div><strong>{formatCOP(Number(line.valor_total))}</strong></div>)}</div> : <p className="text-sm text-muted">Aún no hay conceptos agregados.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>Visita técnica y condiciones</CardTitle></CardHeader><CardContent className="space-y-3 text-sm">{quote.visitas.length ? quote.visitas.map((visit) => <div key={visit.id} className="rounded-lg bg-app-bg p-3"><p className="font-medium">Visita del {formatFecha(visit.fecha.slice(0, 10))}</p>{visit.observaciones && <p className="mt-1 text-muted">{visit.observaciones}</p>}</div>) : <p className="text-muted">La visita técnica aún no está registrada.</p>}<div className="rounded-lg bg-app-bg p-3"><p className="font-medium">Hitos de pago</p>{quote.hitos.length ? quote.hitos.map((milestone) => <p key={milestone.orden} className="mt-1 flex justify-between text-muted"><span>{milestone.descripcion}</span><strong className="text-ink">{milestone.porcentaje}%</strong></p>) : <p className="mt-1 text-muted">Sin hitos registrados.</p>}</div></CardContent></Card>
    </div><aside className="space-y-4"><Card className="border-primary/20"><CardContent className="p-5"><p className="text-xs font-semibold uppercase tracking-[.14em] text-muted">Total de la propuesta</p><p className="mt-2 font-heading text-3xl font-semibold text-primary">{quote.total === null ? "Por elaborar" : formatCOP(Number(quote.total))}</p>{quote.estado === "enviada" && <p className="mt-2 text-xs text-muted">Vigencia: {quote.vigencia_dias} días</p>}{canRespond && <div className="mt-5 grid gap-2"><Button disabled={saving} onClick={() => void respond(true)}><CheckCircle2 className="size-4" /> Aceptar cotización</Button><Button disabled={saving} variant="outline" onClick={() => void respond(false)}>Rechazar cotización</Button></div>}{rol === "cliente" && !canRespond && quote.estado === "enviada" && <p className="mt-4 text-xs text-status-error">La vigencia de esta cotización terminó.</p>}</CardContent></Card>{rol === "administrador" && quote.costos && <Card><CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="size-4" /> Costos internos</CardTitle></CardHeader><CardContent className="space-y-2 text-sm">{quote.costos.length ? quote.costos.map((cost) => <div key={cost.id} className="flex justify-between gap-3"><span className="text-muted">{cost.descripcion}</span><strong>{formatCOP(Number(cost.subtotal))}</strong></div>) : <p className="text-muted">No hay costos registrados.</p>}</CardContent></Card>}</aside></div>
  </div>;
}

function Info({ icon: Icon, label, value }: { icon: typeof FileText; label: string; value: string }) { return <div className="flex items-start gap-3"><Icon className="mt-0.5 size-4 text-primary" /><div><p className="text-xs uppercase tracking-wide text-muted">{label}</p><p className="mt-1 text-ink">{value}</p></div></div>; }
function TextBlock({ label, value }: { label: string; value: string | null }) { return value ? <div><p className="text-xs uppercase tracking-wide text-muted">{label}</p><p className="mt-1 whitespace-pre-wrap text-ink">{value}</p></div> : null; }
