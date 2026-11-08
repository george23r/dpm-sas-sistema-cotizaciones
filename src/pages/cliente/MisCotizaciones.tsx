import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { cotizacionVigente, consecutivoCotizacion, fechaVencimiento } from "@/lib/cotizaciones";
import { formatCOP, formatFecha } from "@/lib/utils";
import { obtenerCotizacionesApi, responderCotizacionApi, type CotizacionApi } from "@/api/cotizaciones";
import { EstadoCotizacionBadge } from "@/components/shared/EstadoBadge";
import { Card, CardContent } from "@/components/ui/card";import { Button } from "@/components/ui/button";import { HuTag } from "@/components/shared/HuTag";
export function MisCotizaciones(){
 const {modoDemo}=useApp();
 if(!modoDemo)return <MisCotizacionesApi />;
 return <MisCotizacionesDemo />;
}

function MisCotizacionesDemo(){
 const {cotizaciones,clienteActualId,responderCotizacion}=useApp();
 const [error,setError]=useState("");
 const mis=cotizaciones.filter(c=>c.clienteId===clienteActualId).sort((a,b)=>b.fechaSolicitud.localeCompare(a.fechaSolicitud));
 function responder(id:string,aceptar:boolean){setError("");const r=responderCotizacion(id,aceptar);if(!r.ok)setError(r.error);}
 return <div className="space-y-5"><HuTag id="HU-02"/><div className="flex items-center justify-between"><div><h1 className="font-heading text-2xl font-semibold">Mis cotizaciones</h1><p className="text-sm text-muted">Consulta estados y responde cotizaciones vigentes desde tu panel.</p></div><Button asChild><Link to="/app/cliente/cotizaciones/nueva">Nueva solicitud</Link></Button></div>
 {error&&<p role="alert" className="text-status-error">{error}</p>}
 {mis.map(c=><Card key={c.id}><CardContent className="space-y-3 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{consecutivoCotizacion(c.id)} · {c.objeto}</strong><EstadoCotizacionBadge estado={c.estado}/></div><p className="text-xs text-muted">{c.zonaNombre} · Solicitada {formatFecha(c.fechaSolicitud)}</p>{c.precio!==null&&<p className="text-lg font-semibold">{formatCOP(c.precio)}</p>}{fechaVencimiento(c)&&<p className="text-sm">Vence el {formatFecha(fechaVencimiento(c)!)}</p>}{!!c.lineas.length&&c.estado!=="solicitada"&&<ul className="text-sm">{c.lineas.map(l=><li key={l.id}>{l.concepto}: {l.cantidad} {l.unidad} × {formatCOP(l.valorUnitario)}</li>)}</ul>}
 {c.estado==="enviada"&&<div className="flex gap-2">{cotizacionVigente(c)?<><Button onClick={()=>responder(c.id,true)}>Aceptar</Button><Button variant="outline" onClick={()=>responder(c.id,false)}>Rechazar</Button></>:<p className="text-sm text-status-error">La cotización venció; solicita una nueva.</p>}</div>}</CardContent></Card>)}
 {!mis.length&&<p className="text-sm text-muted">Aún no tienes cotizaciones.</p>}</div>;
}

function MisCotizacionesApi(){
 const [rows,setRows]=useState<CotizacionApi[]>([]);const [error,setError]=useState("");const [loading,setLoading]=useState(true);const [saving,setSaving]=useState<number|null>(null);
 const load=()=>obtenerCotizacionesApi().then(r=>setRows(r.data)).catch((e:Error)=>setError(e.message)).finally(()=>setLoading(false));
 useEffect(()=>{void load();},[]);
 async function responder(id:number,acepta:boolean){setSaving(id);setError("");try{await responderCotizacionApi(id,acepta);await load();}catch(e){setError(e instanceof Error?e.message:"No fue posible registrar la respuesta.");}finally{setSaving(null);}}
 return <div className="space-y-5"><HuTag id="HU-02"/><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Portal cliente</p><h1 className="font-heading text-2xl font-semibold">Mis cotizaciones</h1><p className="text-sm text-muted">Consulta únicamente propuestas asociadas a tu cuenta y responde las que estén vigentes.</p></div>{error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-error">{error}</p>}{loading?<p className="text-sm text-muted">Cargando cotizaciones…</p>:rows.map(c=><Card key={c.id}><CardContent className="space-y-3 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{c.consecutivo} · {c.objeto}</strong><EstadoCotizacionBadge estado={c.estado}/></div><p className="text-xs text-muted">{c.zona} · Solicitada {formatFecha(c.solicitada_en.slice(0,10))}</p>{c.total!==null&&<p className="text-lg font-semibold">{formatCOP(Number(c.total))}</p>}{c.estado==="enviada"&&<div className="flex gap-2"><Button disabled={saving===c.id} onClick={()=>void responder(c.id,true)}>Aceptar</Button><Button disabled={saving===c.id} variant="outline" onClick={()=>void responder(c.id,false)}>Rechazar</Button></div>}</CardContent></Card>)}{!loading&&!rows.length&&<p className="text-sm text-muted">Aún no tienes cotizaciones.</p>}</div>;
}
