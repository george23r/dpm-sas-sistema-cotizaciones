import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { SERVICIOS_DPM } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";import { Textarea } from "@/components/ui/textarea";import { Button } from "@/components/ui/button";import { HuTag } from "@/components/shared/HuTag";
export function SolicitarCotizacion(){
 const {zonas,clienteActualId,crearCotizacion}=useApp();const nav=useNavigate();const location=useLocation();
 const pre=(location.state as {zonaId?:string}|null)?.zonaId;
 const propias=zonas.filter(z=>z.clienteId===clienteActualId);
 const [zonaId,setZonaId]=useState(pre&&propias.some(z=>z.id===pre)?pre:propias[0]?.id??"");
 const [servicio,setServicio]=useState<string>(SERVICIOS_DPM[0]);const [observaciones,setObservaciones]=useState("");const [error,setError]=useState("");
 function enviar(e:React.FormEvent){e.preventDefault();const zona=propias.find(z=>z.id===zonaId);if(!zona){setError("Selecciona una zona registrada.");return;}
  crearCotizacion({clienteId:clienteActualId,zonaId:zona.id,zonaNombre:zona.nombre,servicio,objeto:servicio+" en "+zona.nombre,observaciones,estado:"solicitada",fechaVisita:null,lineas:[],costos:[],hitos:[],origen:"cliente"});nav("/app/cliente/cotizaciones");
 }
 return <div className="mx-auto max-w-2xl space-y-5"><HuTag id="HU-02"/><div><h1 className="font-heading text-2xl font-semibold">Solicitar cotización</h1><p className="text-sm text-muted">DPM elaborará el presupuesto después de la visita técnica. Consulta su estado en Mis cotizaciones.</p></div><Card><CardHeader><CardTitle>Información del servicio</CardTitle></CardHeader><CardContent><form onSubmit={enviar} className="space-y-4"><label className="block text-sm">Zona / predio<Select value={zonaId} onChange={e=>setZonaId(e.target.value)}>{propias.map(z=><option key={z.id} value={z.id}>{z.nombre}</option>)}</Select></label><label className="block text-sm">Servicio requerido<Select value={servicio} onChange={e=>setServicio(e.target.value)}>{SERVICIOS_DPM.map(s=><option key={s} value={s}>{s}</option>)}</Select></label><label className="block text-sm">Observaciones<Textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Indica qué necesitas"/></label>{error&&<p role="alert" className="text-status-error">{error}</p>}<Button type="submit">Enviar solicitud</Button></form></CardContent></Card></div>;
}
