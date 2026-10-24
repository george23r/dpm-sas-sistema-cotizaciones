import { Link } from "react-router-dom";
import { useState } from "react";
import { useApp } from "@/context/AppContext";
import { cotizacionVigente, consecutivoCotizacion, fechaVencimiento } from "@/lib/cotizaciones";
import { formatCOP, formatFecha } from "@/lib/utils";
import { EstadoCotizacionBadge } from "@/components/shared/EstadoBadge";
import { Card, CardContent } from "@/components/ui/card";import { Button } from "@/components/ui/button";import { HuTag } from "@/components/shared/HuTag";
export function MisCotizaciones(){
 const {cotizaciones,clienteActualId,responderCotizacion}=useApp();const [error,setError]=useState("");
 const mis=cotizaciones.filter(c=>c.clienteId===clienteActualId).sort((a,b)=>b.fechaSolicitud.localeCompare(a.fechaSolicitud));
 function responder(id:string,aceptar:boolean){setError("");const r=responderCotizacion(id,aceptar);if(!r.ok)setError(r.error);}
 return <div className="space-y-5"><HuTag id="HU-02"/><div className="flex items-center justify-between"><div><h1 className="font-heading text-2xl font-semibold">Mis cotizaciones</h1><p className="text-sm text-muted">Consulta estados y responde cotizaciones vigentes desde tu panel.</p></div><Button asChild><Link to="/app/cliente/cotizaciones/nueva">Nueva solicitud</Link></Button></div>
 {error&&<p role="alert" className="text-status-error">{error}</p>}
 {mis.map(c=><Card key={c.id}><CardContent className="space-y-3 p-5"><div className="flex flex-wrap items-center justify-between gap-2"><strong>{consecutivoCotizacion(c.id)} · {c.objeto}</strong><EstadoCotizacionBadge estado={c.estado}/></div><p className="text-xs text-muted">{c.zonaNombre} · Solicitada {formatFecha(c.fechaSolicitud)}</p>{c.precio!==null&&<p className="text-lg font-semibold">{formatCOP(c.precio)}</p>}{fechaVencimiento(c)&&<p className="text-sm">Vence el {formatFecha(fechaVencimiento(c)!)}</p>}{!!c.lineas.length&&c.estado!=="solicitada"&&<ul className="text-sm">{c.lineas.map(l=><li key={l.id}>{l.concepto}: {l.cantidad} {l.unidad} × {formatCOP(l.valorUnitario)}</li>)}</ul>}
 {c.estado==="enviada"&&<div className="flex gap-2">{cotizacionVigente(c)?<><Button onClick={()=>responder(c.id,true)}>Aceptar</Button><Button variant="outline" onClick={()=>responder(c.id,false)}>Rechazar</Button></>:<p className="text-sm text-status-error">La cotización venció; solicita una nueva.</p>}</div>}</CardContent></Card>)}
 {!mis.length&&<p className="text-sm text-muted">Aún no tienes cotizaciones.</p>}</div>;
}
