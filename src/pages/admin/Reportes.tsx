import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { HuTag } from "@/components/shared/HuTag";
import { horasJornada, compararPlanillas } from "@/lib/jornadas";
import { formatCOP } from "@/lib/utils";

export function Reportes(){
 const {clientes,cotizaciones,ordenes,planillas,jornadas}=useApp();
 const [clienteId,setClienteId]=useState("todos");
 const [desde,setDesde]=useState("");const [hasta,setHasta]=useState("");
 const datos=useMemo(()=>{
  const filtrar=(id:string,fecha:string)=>(clienteId==="todos"||id===clienteId)&&(!desde||fecha>=desde)&&(!hasta||fecha<=hasta);
  const citas=cotizaciones.filter(c=>filtrar(c.clienteId,c.fechaSolicitud));
  const trabajos=ordenes.filter(o=>filtrar(o.clienteId,o.fecha));
  const grupos=planillas.filter(p=>p.origen==="campo"&&(clienteId==="todos"||p.clienteId===clienteId)&&(!desde||p.hasta>=desde)&&(!hasta||p.desde<=hasta));
  const campos=planillas.filter(p=>grupos.some(g=>g.id===p.id)).map(p=>p.id);
  const delPeriodo=jornadas.filter(j=>campos.includes(j.planillaId)&&(!desde||j.fecha>=desde)&&(!hasta||j.fecha<=hasta));
  const conciliadas=grupos.filter(p=>p.estado==="conciliada").length;
  const diferencias=grupos.reduce((t,p)=>{const a=planillas.find(x=>x.origen==="administrativa"&&x.clienteId===p.clienteId&&x.desde===p.desde&&x.hasta===p.hasta);return t+(a?compararPlanillas(jornadas,p.id,a.id).filter(r=>r.resultado!=="coincide").length:0)},0);
  return {horasCampo:Math.round(delPeriodo.reduce((t,j)=>t+horasJornada(j),0)*100)/100,conciliadas,diferencias,citas,trabajos,solicitadas:citas.length,aceptadas:citas.filter(c=>c.estado==="aceptada").length,valorAceptado:citas.filter(c=>c.estado==="aceptada").reduce((t,c)=>t+(c.precio??0),0),finalizados:trabajos.filter(o=>o.estado==="finalizado").length};
 },[clienteId,desde,hasta,cotizaciones,ordenes,planillas,jornadas]);
 return <div className="relative space-y-5"><HuTag id="HU-08"/>
 <div><h1 className="font-heading text-2xl font-semibold text-ink">Reportes operativos</h1><p className="text-sm text-muted">Resumen demostrativo por cliente y periodo. Los datos se mantienen en memoria y no representan cifras reales de DPM.</p></div>
 <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-3">
 <label className="text-sm">Cliente<Select value={clienteId} onChange={e=>setClienteId(e.target.value)}><option value="todos">Todos los clientes</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</Select></label>
 <label className="text-sm">Desde<Input type="date" value={desde} onChange={e=>setDesde(e.target.value)}/></label>
 <label className="text-sm">Hasta<Input type="date" value={hasta} onChange={e=>setHasta(e.target.value)}/></label>
 </CardContent></Card>
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 {([["Cotizaciones solicitadas",datos.solicitadas],["Cotizaciones aceptadas",datos.aceptadas],["Valor aceptado",formatCOP(datos.valorAceptado)],["Servicios finalizados",datos.finalizados]] as const).map(([nombre,valor])=><Card key={nombre}><CardContent className="space-y-1 p-5"><p className="text-sm text-muted">{nombre}</p><p className="text-2xl font-semibold text-ink">{valor}</p></CardContent></Card>)}
 </div>
 <div className="grid gap-3 sm:grid-cols-3">{([["Horas de campo",datos.horasCampo.toFixed(2)+" h"],["Pares conciliados",datos.conciliadas],["Diferencias detectadas",datos.diferencias]] as const).map(([k,v])=><Card key={k}><CardContent className="p-5"><p className="text-sm text-muted">{k}</p><p className="text-2xl font-semibold">{v}</p></CardContent></Card>)}</div>
 <Card><CardContent className="overflow-x-auto p-4"><h2 className="mb-3 font-semibold text-ink">Servicios del periodo</h2><table className="w-full text-left text-sm"><thead><tr className="border-b border-line"><th className="p-2">Fecha</th><th className="p-2">Cliente</th><th className="p-2">Servicio</th><th className="p-2">Estado</th></tr></thead><tbody>{datos.trabajos.map(o=><tr key={o.id} className="border-b border-line"><td className="p-2">{o.fecha}</td><td className="p-2">{clientes.find(c=>c.id===o.clienteId)?.nombre??"—"}</td><td className="p-2">{o.tipoServicio}</td><td className="p-2">{o.estado.replace("_"," ")}</td></tr>)}</tbody></table>{datos.trabajos.length===0&&<p className="p-3 text-muted">No hay resultados para los filtros seleccionados.</p>}</CardContent></Card>
 <p className="text-xs text-muted">Las horas reflejan los registros ficticios de HU-09. El reporte filtra jornadas por fecha de registro y pares de planillas por periodo; no está conectado a PostgreSQL.</p>
 </div>;
}
