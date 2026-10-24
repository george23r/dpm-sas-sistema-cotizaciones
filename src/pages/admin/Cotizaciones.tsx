import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { ESTADOS_COTIZACION, type EstadoCotizacion } from "@/types";
import { cotizacionVigente, consecutivoCotizacion, fechaVencimiento } from "@/lib/cotizaciones";
import { formatCOP,formatFecha } from "@/lib/utils";
import { EstadoCotizacionBadge } from "@/components/shared/EstadoBadge";
import { HuTag } from "@/components/shared/HuTag";
import { Card, CardContent } from "@/components/ui/card";import { Input } from "@/components/ui/input";import { Select } from "@/components/ui/select";import { Button } from "@/components/ui/button";
export function Cotizaciones(){
 const {cotizaciones,clientes,responderCotizacion}=useApp();
 const [busqueda,setBusqueda]=useState("");const [estado,setEstado]=useState<EstadoCotizacion|"todos">("todos");const [error,setError]=useState("");
 const lista=useMemo(()=>cotizaciones.filter(c=>(estado==="todos"||c.estado===estado)&&[c.objeto,c.zonaNombre,clientes.find(x=>x.id===c.clienteId)?.nombre].join(" ").toLowerCase().includes(busqueda.toLowerCase())).sort((a,b)=>b.fechaSolicitud.localeCompare(a.fechaSolicitud)),[cotizaciones,clientes,busqueda,estado]);
 return <div className="space-y-5"><HuTag id="HU-01"/><div className="flex items-center justify-between"><div><h1 className="font-heading text-2xl font-semibold">Cotizaciones</h1><p className="text-sm text-muted">Elaboración por líneas y visita técnica.</p></div><Button asChild><Link to="/app/admin/cotizaciones/nueva">Nueva cotización</Link></Button></div>
 <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2"><Input placeholder="Buscar por cliente, predio u objeto" value={busqueda} onChange={e=>setBusqueda(e.target.value)}/><Select value={estado} onChange={e=>setEstado(e.target.value as EstadoCotizacion|"todos")}><option value="todos">Todos los estados</option>{Object.entries(ESTADOS_COTIZACION).map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select></CardContent></Card>
 {error&&<p role="alert" className="text-status-error">{error}</p>}
 <Card><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-line text-left"><th className="p-3">Consecutivo / cliente</th><th className="p-3">Objeto</th><th className="p-3">Vigencia</th><th className="p-3">Estado</th><th className="p-3">Total</th><th className="p-3">Acción</th></tr></thead><tbody>{lista.map(c=><tr key={c.id} className="border-b border-line"><td className="p-3"><strong>{consecutivoCotizacion(c.id)}</strong><p>{clientes.find(x=>x.id===c.clienteId)?.nombre}</p></td><td className="p-3">{c.objeto}<p className="text-xs text-muted">{c.zonaNombre}</p></td><td className="p-3">{fechaVencimiento(c)?formatFecha(fechaVencimiento(c)!):"—"}</td><td className="p-3"><EstadoCotizacionBadge estado={c.estado}/></td><td className="p-3">{c.precio===null?"Por elaborar":formatCOP(c.precio)}</td><td className="p-3">{["solicitada","borrador"].includes(c.estado)?<Button asChild variant="outline" size="sm"><Link to={"/app/admin/cotizaciones/editar/"+c.id}>Elaborar</Link></Button>:c.estado==="enviada"?<span className="text-xs">{cotizacionVigente(c)?"Esperando respuesta":"Vencida"}</span>:"—"}</td></tr>)}</tbody></table>{!lista.length&&<p className="p-5 text-sm text-muted">Sin resultados</p>}</div></Card></div>;
}
