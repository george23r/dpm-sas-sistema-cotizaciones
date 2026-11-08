import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { SERVICIOS_DPM } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { crearCotizacionApi } from "@/api/cotizaciones";
import { obtenerZonasApi, type ZonaApi } from "@/api/catalogos";
import { Select } from "@/components/ui/select";import { Textarea } from "@/components/ui/textarea";import { Button } from "@/components/ui/button";import { HuTag } from "@/components/shared/HuTag";
export function SolicitarCotizacion(){
 const {modoDemo}=useApp();
 if(!modoDemo)return <SolicitarCotizacionApi />;
 return <SolicitarCotizacionDemo />;
}

function SolicitarCotizacionDemo(){
 const {zonas,clienteActualId,crearCotizacion}=useApp();
 const nav=useNavigate();const location=useLocation();
 const pre=(location.state as {zonaId?:string}|null)?.zonaId;
 const propias=zonas.filter(z=>z.clienteId===clienteActualId);
 const [zonaId,setZonaId]=useState(pre&&propias.some(z=>z.id===pre)?pre:propias[0]?.id??"");
 const [servicio,setServicio]=useState<string>(SERVICIOS_DPM[0]);const [observaciones,setObservaciones]=useState("");const [error,setError]=useState("");
 function enviar(e:React.FormEvent){e.preventDefault();const zona=propias.find(z=>z.id===zonaId);if(!zona){setError("Selecciona una zona registrada.");return;}
  crearCotizacion({clienteId:clienteActualId,zonaId:zona.id,zonaNombre:zona.nombre,servicio,objeto:servicio+" en "+zona.nombre,observaciones,estado:"solicitada",fechaVisita:null,lineas:[],costos:[],hitos:[],origen:"cliente"});nav("/app/cliente/cotizaciones");
 }
 return <div className="mx-auto max-w-2xl space-y-5"><HuTag id="HU-02"/><div><h1 className="font-heading text-2xl font-semibold">Solicitar cotización</h1><p className="text-sm text-muted">DPM elaborará el presupuesto después de la visita técnica. Consulta su estado en Mis cotizaciones.</p></div><Card><CardHeader><CardTitle>Información del servicio</CardTitle></CardHeader><CardContent><form onSubmit={enviar} className="space-y-4"><label className="block text-sm">Zona / predio<Select value={zonaId} onChange={e=>setZonaId(e.target.value)}>{propias.map(z=><option key={z.id} value={z.id}>{z.nombre}</option>)}</Select></label><label className="block text-sm">Servicio requerido<Select value={servicio} onChange={e=>setServicio(e.target.value)}>{SERVICIOS_DPM.map(s=><option key={s} value={s}>{s}</option>)}</Select></label><label className="block text-sm">Observaciones<Textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Indica qué necesitas"/></label>{error&&<p role="alert" className="text-status-error">{error}</p>}<Button type="submit">Enviar solicitud</Button></form></CardContent></Card></div>;
}

function SolicitarCotizacionApi(){
 const nav=useNavigate();const location=useLocation();const [zonas,setZonas]=useState<ZonaApi[]>([]);const [zonaId,setZonaId]=useState("");const [servicio,setServicio]=useState<string>(SERVICIOS_DPM[0]);const [observaciones,setObservaciones]=useState("");const [error,setError]=useState("");const [saving,setSaving]=useState(false);
 const pre=(location.state as {zonaId?:string}|null)?.zonaId;
 useEffect(()=>{obtenerZonasApi().then(r=>{setZonas(r.data);if(pre&&r.data.some(z=>String(z.id)===pre))setZonaId(pre);else if(r.data[0])setZonaId(String(r.data[0].id));}).catch((e:Error)=>setError(e.message));},[pre]);
 async function enviar(e:React.FormEvent){e.preventDefault();const zona=zonas.find(z=>String(z.id)===zonaId);if(!zona){setError("Selecciona una zona registrada.");return;}setSaving(true);setError("");try{await crearCotizacionApi({zonaId:zona.id,objeto:`${servicio} en ${zona.nombre}`,observaciones});nav("/app/cliente/cotizaciones");}catch(e){setError(e instanceof Error?e.message:"No fue posible enviar la solicitud.");}finally{setSaving(false);}}
 return <div className="mx-auto max-w-2xl space-y-5"><HuTag id="HU-02"/><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Portal cliente</p><h1 className="font-heading text-2xl font-semibold">Solicitar cotización</h1><p className="text-sm text-muted">La solicitud queda registrada en PostgreSQL para revisión administrativa y visita técnica.</p></div><Card><CardHeader><CardTitle>Información del servicio</CardTitle></CardHeader><CardContent><form onSubmit={enviar} className="space-y-4"><label className="block text-sm">Zona / predio<Select value={zonaId} onChange={e=>setZonaId(e.target.value)}><option value="">Seleccionar zona</option>{zonas.map(z=><option key={z.id} value={z.id}>{z.nombre}</option>)}</Select></label><label className="block text-sm">Servicio requerido<Select value={servicio} onChange={e=>setServicio(e.target.value)}>{SERVICIOS_DPM.map(s=><option key={s} value={s}>{s}</option>)}</Select></label><label className="block text-sm">Observaciones<Textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Indica qué necesitas"/></label>{error&&<p role="alert" className="text-status-error">{error}</p>}<Button type="submit" disabled={saving}>{saving?"Enviando…":"Enviar solicitud"}</Button></form></CardContent></Card></div>;
}
