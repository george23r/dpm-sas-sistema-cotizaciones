import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { cotizacionVigente, consecutivoCotizacion, fechaVencimiento } from "@/lib/cotizaciones";
import { formatCOP, formatFecha } from "@/lib/utils";
import { obtenerCotizacionesApi, responderCotizacionApi, type CotizacionApi } from "@/api/cotizaciones";
import { EstadoCotizacionBadge } from "@/components/shared/EstadoBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HuTag } from "@/components/shared/HuTag";

export function MisCotizaciones() { const { modoDemo } = useApp(); return modoDemo ? <MisCotizacionesDemo /> : <MisCotizacionesApi />; }

function MisCotizacionesDemo() {
  const { cotizaciones, clienteActualId, responderCotizacion } = useApp(); const [error, setError] = useState("");
  const rows = cotizaciones.filter((quote) => quote.clienteId === clienteActualId).sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud));
  function respond(id: string, accept: boolean) { setError(""); const result = responderCotizacion(id, accept); if (!result.ok) setError(result.error); }
  return <div className="space-y-5"><HuTag id="HU-02" /><div className="flex items-center justify-between"><div><h1 className="font-heading text-2xl font-semibold">Mis cotizaciones</h1><p className="text-sm text-muted">Consulta estados y responde propuestas vigentes.</p></div><Button asChild><Link to="/app/cliente/cotizaciones/nueva">Nueva solicitud</Link></Button></div>{error && <p role="alert" className="text-status-error">{error}</p>}{rows.map((quote) => <Card key={quote.id}><CardContent className="space-y-3 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{consecutivoCotizacion(quote.id)} · {quote.objeto}</strong><EstadoCotizacionBadge estado={quote.estado} /></div><p className="text-xs text-muted">{quote.zonaNombre} · Solicitada {formatFecha(quote.fechaSolicitud)}</p>{quote.precio !== null && <p className="text-lg font-semibold">{formatCOP(quote.precio)}</p>}{fechaVencimiento(quote) && <p className="text-sm">Vence el {formatFecha(fechaVencimiento(quote)!)}</p>}{quote.estado === "enviada" && <div className="flex gap-2">{cotizacionVigente(quote) ? <><Button onClick={() => respond(quote.id, true)}>Aceptar</Button><Button variant="outline" onClick={() => respond(quote.id, false)}>Rechazar</Button></> : <p className="text-sm text-status-error">La cotización venció.</p>}</div>}</CardContent></Card>)}{!rows.length && <p className="text-sm text-muted">Aún no tienes cotizaciones.</p>}</div>;
}

function MisCotizacionesApi() {
  const [rows, setRows] = useState<CotizacionApi[]>([]); const [error, setError] = useState(""); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState<number | null>(null);
  const load = () => obtenerCotizacionesApi().then((result) => setRows(result.data)).catch((reason: Error) => setError(reason.message)).finally(() => setLoading(false));
  useEffect(() => { void load(); }, []);
  async function respond(id: number, accept: boolean) { setSaving(id); setError(""); try { await responderCotizacionApi(id, accept); await load(); } catch (reason) { setError(reason instanceof Error ? reason.message : "No fue posible registrar la respuesta."); } finally { setSaving(null); } }
  return <div className="space-y-5"><HuTag id="HU-02" /><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Portal cliente</p><h1 className="font-heading text-2xl font-semibold">Mis cotizaciones</h1><p className="text-sm text-muted">Consulta únicamente propuestas asociadas a tu cuenta y responde las que estén vigentes.</p></div>{error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-error">{error}</p>}{loading ? <p className="text-sm text-muted">Cargando cotizaciones…</p> : rows.map((quote) => <Card key={quote.id}><CardContent className="space-y-3 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{quote.consecutivo} · {quote.objeto}</strong><EstadoCotizacionBadge estado={quote.estado} /></div><p className="text-xs text-muted">{quote.zona} · Solicitada {formatFecha(quote.solicitada_en.slice(0, 10))}</p>{quote.total !== null && <p className="text-lg font-semibold">{formatCOP(Number(quote.total))}</p>}<div className="flex flex-wrap gap-2"><Button asChild variant="outline" size="sm"><Link to={`/app/cliente/cotizaciones/${quote.id}`}>Ver detalle</Link></Button>{quote.estado === "enviada" && <><Button disabled={saving === quote.id} onClick={() => void respond(quote.id, true)}>Aceptar</Button><Button disabled={saving === quote.id} variant="outline" onClick={() => void respond(quote.id, false)}>Rechazar</Button></>}</div></CardContent></Card>)}{!loading && !rows.length && <p className="text-sm text-muted">Aún no tienes cotizaciones.</p>}</div>;
}
