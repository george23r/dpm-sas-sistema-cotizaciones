import { useMemo, useState } from "react";
import { useApp } from "@/context/AppContext";
import { compararPlanillas, horasJornada } from "@/lib/jornadas";
import { HuTag } from "@/components/shared/HuTag";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
export function Jornadas(){
 const {clientes,zonas,planillas,jornadas,crearParejaPlanillas,agregarJornada,conciliarPlanillas}=useApp();
 const [clienteId,setClienteId]=useState(clientes[0]?.id??"");
 const [desde,setDesde]=useState("2026-10-01"),[hasta,setHasta]=useState("2026-10-15");
 const [parId,setParId]=useState("p-campo-01");
 const [origen,setOrigen]=useState<"campo"|"administrativa">("campo");
 const [trabajador,setTrabajador]=useState(""),[labor,setLabor]=useState("Poda");
 const [fecha,setFecha]=useState("2026-10-07"),[zonaId,setZonaId]=useState("");
 const [inicio,setInicio]=useState("08:00"),[fin,setFin]=useState("16:00"),[descanso,setDescanso]=useState(0),[festivo,setFestivo]=useState(false);
 const [mensaje,setMensaje]=useState("");
 const campo=planillas.find(p=>p.id===parId&&p.origen==="campo");
 const admin=planillas.find(p=>p.clienteId===campo?.clienteId&&p.desde===campo.desde&&p.hasta===campo.hasta&&p.origen==="administrativa");
 const planilla=origen==="campo"?campo:admin;
 const zonasValidas=zonas.filter(z=>z.clienteId===campo?.clienteId);
 const zonaActual=zonasValidas.some(z=>z.id===zonaId)?zonaId:zonasValidas[0]?.id??"";
 const resultado=useMemo(()=>campo&&admin?compararPlanillas(jornadas,campo.id,admin.id):[],[jornadas,campo,admin]);
 const diferencia=resultado.filter(r=>r.resultado!=="coincide").length;
 const hrsCampo=jornadas.filter(r=>r.planillaId===campo?.id).reduce((t,r)=>t+horasJornada(r),0);
 const hrsAdmin=jornadas.filter(r=>r.planillaId===admin?.id).reduce((t,r)=>t+horasJornada(r),0);
 const cerrado=campo?.estado==="conciliada";
 function crear(){const r=crearParejaPlanillas(clienteId,desde,hasta);setMensaje(r.ok?"Pareja creada para comparar.":r.error);if(r.ok){setParId(r.campoId);setFecha(desde);}}
 function agregar(e:React.FormEvent){e.preventDefault();if(!planilla)return;
 const r=agregarJornada({planillaId:planilla.id,trabajador:trabajador.trim(),fecha,zonaId:zonaActual,labor,inicio,fin,descansoMin:descanso,festivo});
 setMensaje(r.ok?"Jornada guardada en el prototipo.":r.error);if(r.ok)setTrabajador("");
 }
 function conciliar(){if(!campo||!admin)return;const r=conciliarPlanillas(campo.id,admin.id);setMensaje(r.ok?"Planillas conciliadas y bloqueadas.":r.error);}
 return <div className="relative space-y-5"><HuTag id="HU-09"/><h1 className="font-heading text-2xl font-semibold text-ink">Jornadas y conciliación</h1><p className="text-sm text-muted">HU-09 y HU-10 · Datos ficticios compartidos con Reportes. Sin facturación ni conexión a PostgreSQL.</p>
 <Card><CardContent className="space-y-3 p-4"><h2 className="font-semibold">Crear par de planillas</h2><div className="grid gap-2 sm:grid-cols-4"><label className="text-sm">Cliente<Select value={clienteId} onChange={e=>setClienteId(e.target.value)}>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</Select></label><label className="text-sm">Desde<Input type="date" value={desde} onChange={e=>setDesde(e.target.value)}/></label><label className="text-sm">Hasta<Input type="date" value={hasta} onChange={e=>setHasta(e.target.value)}/></label><Button className="self-end" onClick={crear}>Crear par</Button></div></CardContent></Card>
 <Card><CardContent className="space-y-3 p-4"><label className="block text-sm">Par de planillas<Select value={parId} onChange={e=>{setParId(e.target.value);setMensaje("");}}>{planillas.filter(p=>p.origen==="campo").map(p=><option key={p.id} value={p.id}>{clientes.find(c=>c.id===p.clienteId)?.nombre} · {p.desde} a {p.hasta} · {p.estado}</option>)}</Select></label>
 {campo&&admin&&<><div className="grid gap-2 sm:grid-cols-3"><p>Campo: <strong>{hrsCampo.toFixed(2)} h</strong></p><p>Administración: <strong>{hrsAdmin.toFixed(2)} h</strong></p><p>Diferencias: <strong>{diferencia}</strong></p></div>
 <form className="grid gap-3 sm:grid-cols-3" onSubmit={agregar}><label className="text-sm">Origen<Select disabled={cerrado} value={origen} onChange={e=>setOrigen(e.target.value as "campo"|"administrativa")}><option value="campo">Campo</option><option value="administrativa">Administración</option></Select></label><label className="text-sm">Trabajador ficticio<Input disabled={cerrado} required value={trabajador} onChange={e=>setTrabajador(e.target.value)}/></label><label className="text-sm">Zona<Select disabled={cerrado} value={zonaActual} onChange={e=>setZonaId(e.target.value)}>{zonasValidas.map(z=><option key={z.id} value={z.id}>{z.nombre}</option>)}</Select></label><label className="text-sm">Fecha<Input disabled={cerrado} type="date" min={campo.desde} max={campo.hasta} value={fecha} onChange={e=>setFecha(e.target.value)}/></label><label className="text-sm">Labor<Input disabled={cerrado} required value={labor} onChange={e=>setLabor(e.target.value)}/></label><label className="text-sm">Descanso (minutos)<Input disabled={cerrado} type="number" min={0} max={1439} value={descanso} onChange={e=>setDescanso(Number(e.target.value))}/></label><label className="text-sm">Inicio<Input disabled={cerrado} type="time" value={inicio} onChange={e=>setInicio(e.target.value)}/></label><label className="text-sm">Fin<Input disabled={cerrado} type="time" value={fin} onChange={e=>setFin(e.target.value)}/></label><label className="text-sm self-center"><input disabled={cerrado} type="checkbox" checked={festivo} onChange={e=>setFestivo(e.target.checked)}/> Dominical o festivo</label><Button disabled={cerrado} type="submit">Registrar jornada</Button></form>
 <h3 className="font-semibold">Comparación HU-10</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b"><th className="p-2">Operario / Fecha</th><th className="p-2">Campo</th><th className="p-2">Administración</th><th className="p-2">Diferencia</th><th className="p-2">Resultado</th></tr></thead><tbody>{resultado.map(r=><tr key={r.clave} className="border-b"><td className="p-2">{r.trabajador} · {r.fecha}</td><td className="p-2">{r.campo??"—"}</td><td className="p-2">{r.administrativa??"—"}</td><td className="p-2">{r.diferencia}</td><td className="p-2">{r.resultado.replace("_"," ")}</td></tr>)}</tbody></table></div>
 <Button disabled={cerrado||!resultado.length||diferencia>0} onClick={conciliar}>{cerrado?"Conciliadas":"Conciliar planillas"}</Button></>}
 {mensaje&&<p role="status" className="text-sm text-primary">{mensaje}</p>}</CardContent></Card>
 </div>;
}
