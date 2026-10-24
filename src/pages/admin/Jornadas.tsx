import { useMemo, useState } from "react";
import { HuTag } from "@/components/shared/HuTag";

type Origen = "campo" | "administrativa";
type Registro = { id: number; origen: Origen; fecha: string; trabajador: string; lote: string; inicio: string; fin: string; descanso: number; festivo: boolean };
const EJEMPLO: Registro[] = [
  { id: 1, origen: "campo", fecha: "2026-10-07", trabajador: "Operario ejemplo A", lote: "Lote 002", inicio: "18:00", fin: "06:00", descanso: 0, festivo: false },
  { id: 2, origen: "administrativa", fecha: "2026-10-07", trabajador: "Operario ejemplo A", lote: "Lote 002", inicio: "18:00", fin: "06:00", descanso: 0, festivo: false },
  { id: 3, origen: "campo", fecha: "2026-10-07", trabajador: "Operario ejemplo B", lote: "Lote 005", inicio: "06:00", fin: "14:00", descanso: 0, festivo: false },
  { id: 4, origen: "administrativa", fecha: "2026-10-07", trabajador: "Operario ejemplo B", lote: "Lote 005", inicio: "06:00", fin: "12:00", descanso: 0, festivo: false },
];
function horas(r:Registro):number {
 const [hi,mi]=r.inicio.split(":").map(Number),[hf,mf]=r.fin.split(":").map(Number);
 const a=hi*60+mi,b=hf*60+mf; return Math.max(0,Math.round(((b<=a?b+1440:b)-a-r.descanso)*100/60)/100);
}
export function Jornadas(){
 const [registros,setRegistros]=useState<Registro[]>(EJEMPLO);
 const [origen,setOrigen]=useState<Origen>("campo");
 const [trabajador,setTrabajador]=useState(""); const [lote,setLote]=useState("");
 const [fecha,setFecha]=useState("2026-10-24"); const [inicio,setInicio]=useState("08:00"); const [fin,setFin]=useState("16:00");
 const [descanso,setDescanso]=useState(0); const [festivo,setFestivo]=useState(false);
 const [tab,setTab]=useState<"registro"|"comparar">("registro");
 const [conciliada,setConciliada]=useState(false);
 const rows=useMemo(()=>{
 const keys=[...new Set(registros.map(r=>r.trabajador+"|"+r.fecha+"|"+r.lote))];
 return keys.map(key=>{
 const same=registros.filter(r=>[r.trabajador,r.fecha,r.lote].join("|")===key);
 const a=same.find(r=>r.origen==="campo"),b=same.find(r=>r.origen==="administrativa");
 const resultado=!a?"solo administrativa":!b?"solo campo":Math.abs(horas(a)-horas(b))<0.001?"coincide":"diferente";
 return {key,a,b,resultado};
 });
 },[registros]);
 const pendientes=rows.filter(x=>x.resultado!=="coincide").length;
 function agregar(e: React.FormEvent){e.preventDefault();if(!trabajador.trim()||!lote.trim()||!fecha)return;
 setRegistros(old=>[...old,{id:Math.max(0,...old.map(r=>r.id))+1,origen,fecha,trabajador:trabajador.trim(),lote:lote.trim(),inicio,fin,descanso:Number(descanso),festivo}]);setConciliada(false);setTrabajador("");}
 return <div className="relative space-y-5">
  <HuTag id={tab==="registro"?"HU-09":"HU-10"}/>
  <div><h1 className="font-heading text-2xl font-semibold text-ink">Jornadas y conciliación</h1><p className="text-sm text-muted">Prototipo con datos ficticios en memoria. Sin integración de API ni generación de facturas.</p></div>
  <div className="flex gap-2"><button className="rounded-lg border border-line p-3" onClick={()=>setTab("registro")}>Registrar jornadas · HU-09</button><button className="rounded-lg border border-line p-3" onClick={()=>setTab("comparar")}>Comparar planillas · HU-10</button></div>
  {tab==="registro"?<>
   <form onSubmit={agregar} className="grid gap-3 rounded-xl border border-line bg-surface p-4 sm:grid-cols-3">
    <label className="text-sm">Origen<select className="block w-full rounded border p-2" value={origen} onChange={e=>setOrigen(e.target.value as Origen)}><option value="campo">Campo</option><option value="administrativa">Administrativa</option></select></label>
    <label className="text-sm">Fecha<input className="block w-full rounded border p-2" type="date" value={fecha} onChange={e=>setFecha(e.target.value)}/></label>
    <label className="text-sm">Trabajador<input className="block w-full rounded border p-2" value={trabajador} onChange={e=>setTrabajador(e.target.value)} required placeholder="Nombre ficticio"/></label>
    <label className="text-sm">Lote<input className="block w-full rounded border p-2" value={lote} onChange={e=>setLote(e.target.value)} required/></label>
    <label className="text-sm">Inicio<input className="block w-full rounded border p-2" type="time" value={inicio} onChange={e=>setInicio(e.target.value)}/></label>
    <label className="text-sm">Fin<input className="block w-full rounded border p-2" type="time" value={fin} onChange={e=>setFin(e.target.value)}/></label>
    <label className="text-sm">Descanso (minutos)<input className="block w-full rounded border p-2" type="number" min={0} max={1440} value={descanso} onChange={e=>setDescanso(Number(e.target.value))}/></label>
    <label className="text-sm"><input type="checkbox" checked={festivo} onChange={e=>setFestivo(e.target.checked)}/> Dominical/festivo</label>
    <button type="submit" className="rounded-lg bg-primary p-2 text-white">Agregar registro de prueba</button>
   </form>
   <div className="overflow-x-auto rounded-xl border border-line"><table className="w-full text-left text-sm"><thead><tr>{["Origen","Trabajador","Fecha","Lote","Horario","Horas"].map(x=><th key={x} className="border-b p-3">{x}</th>)}</tr></thead><tbody>{registros.map(r=><tr key={r.id}><td className="p-3">{r.origen}</td><td className="p-3">{r.trabajador}</td><td className="p-3">{r.fecha}</td><td className="p-3">{r.lote}</td><td className="p-3">{r.inicio}–{r.fin}</td><td className="p-3">{horas(r).toFixed(2)}</td></tr>)}</tbody></table></div>
  </>:<>
    <p className="text-sm text-muted">Comparación demostrativa por trabajador, fecha y lote. Las diferencias bloquean la conciliación.</p>
    <div className="overflow-x-auto rounded-xl border border-line"><table className="w-full text-left text-sm"><thead><tr>{["Registro","Horas campo","Horas administración","Resultado"].map(x=><th key={x} className="border-b p-3">{x}</th>)}</tr></thead><tbody>{rows.map(r=><tr key={r.key}><td className="p-3">{r.key.replaceAll("|"," · ")}</td><td className="p-3">{r.a?horas(r.a).toFixed(2):"—"}</td><td className="p-3">{r.b?horas(r.b).toFixed(2):"—"}</td><td className="p-3 font-semibold">{r.resultado}</td></tr>)}</tbody></table></div>
    <p className="text-sm">{pendientes===0?"Sin diferencias":pendientes+" registro(s) con diferencias"} · {conciliada?"Conciliación simulada completada":"Sin conciliar"}</p>
    <button className="rounded-lg bg-primary p-3 text-white disabled:opacity-40" disabled={pendientes!==0||conciliada||rows.length===0} onClick={()=>setConciliada(true)}>Conciliar planillas (simulación)</button>
  </>}
 </div>;
}
