import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useApp } from "@/context/AppContext";
import { SERVICIOS_DPM, TIPOS_COSTO, type LineaCotizacion, type CostoInterno, type HitoPago, type TipoCosto } from "@/types";
import { totalLineas, totalCostos, sumaHitos, validarEnvio } from "@/lib/cotizaciones";
import { formatCOP } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { HuTag } from "@/components/shared/HuTag";
import { crearCotizacionApi } from "@/api/cotizaciones";
import { obtenerClientesApi, obtenerServiciosApi, obtenerZonasApi, type ClienteApi, type ServicioApi, type ZonaApi } from "@/api/catalogos";
import { ApiError } from "@/api/http";
let seq=0;const uid=()=>String(++seq);
export function NuevaCotizacion(){
 const {modoDemo}=useApp();
 if(!modoDemo)return <NuevaCotizacionApi />;
 return <NuevaCotizacionDemo />;
}

function NuevaCotizacionApi(){
 const nav=useNavigate();
 const [step,setStep]=useState(0);const [busy,setBusy]=useState(false);const [error,setError]=useState("");const [notice,setNotice]=useState("");
 const [clientes,setClientes]=useState<ClienteApi[]>([]);const [zonas,setZonas]=useState<ZonaApi[]>([]);const [servicios,setServicios]=useState<ServicioApi[]>([]);
 const [clienteId,setClienteId]=useState("");const [zonaId,setZonaId]=useState("");const [objeto,setObjeto]=useState("");const [alcance,setAlcance]=useState("");const [incluye,setIncluye]=useState("");const [duracion,setDuracion]=useState("");const [visita,setVisita]=useState("");const [observaciones,setObservaciones]=useState("");const [vigencia,setVigencia]=useState("15");
 const [lineas,setLineas]=useState([{concepto:"",cantidad:1,valorUnitario:0,servicioId:""}]);
 const [costos,setCostos]=useState<{tipo:TipoCosto;descripcion:string;cantidad:number;valorUnitario:number}[]>([]);
 const [hitos,setHitos]=useState([{orden:1,descripcion:"Pago único",porcentaje:100}]);
 const total=lineas.reduce((sum,linea)=>sum+linea.cantidad*linea.valorUnitario,0);const totalHitos=hitos.reduce((sum,hito)=>sum+hito.porcentaje,0);
 useEffect(()=>{Promise.all([obtenerClientesApi(),obtenerServiciosApi()]).then(([c,s])=>{setClientes(c.data);setServicios(s.data);}).catch(e=>setError(e instanceof Error?e.message:"No fue posible cargar los catálogos."));},[]);
 useEffect(()=>{if(!clienteId){setZonas([]);return;} obtenerZonasApi(Number(clienteId)).then(r=>setZonas(r.data)).catch(e=>setError(e instanceof Error?e.message:"No fue posible cargar las zonas."));},[clienteId]);
 const pasos=["Cliente y zona","Visita técnica","Alcance","Conceptos","Costos internos","Hitos y vigencia","Revisión y envío"];
 function validarPaso(){
  if(step===0&&!clienteId)return "Selecciona un cliente."; if(step===0&&!zonaId)return "Selecciona una zona de intervención.";
  if(step===2&&!objeto.trim())return "Indica el objeto de la cotización.";
  if(step===3&&(!lineas.length||lineas.some(l=>!l.concepto.trim()||l.cantidad<=0||l.valorUnitario<0)))return "Revisa los conceptos, cantidades y valores unitarios.";
  if(step===5&&(totalHitos!==100||hitos.some(h=>!h.descripcion.trim())))return "Los hitos deben tener descripción y sumar exactamente 100 %.";
  return "";
 }
 async function guardar(enviar:boolean){
  const fallos=[0,1,2,3,4,5].map((_,i)=>{const actual=step;setStep(i);const message=validarPaso();setStep(actual);return message;}).find(Boolean);
  if(fallos){setError(fallos);return;} if(!clienteId||!zonaId){setError("Cliente y zona son obligatorios.");return;}
  setBusy(true);setError("");setNotice("");
  try{
   await crearCotizacionApi({clienteId:Number(clienteId),zonaId:Number(zonaId),objeto,alcance,incluye,tiempoEjecucion:duracion,observaciones,vigenciaDias:Number(vigencia),visita:visita?{fecha:visita,observaciones}:undefined,lineas:lineas.map((linea)=>({concepto:linea.concepto,cantidad:linea.cantidad,valorUnitario:linea.valorUnitario,servicioId:linea.servicioId?Number(linea.servicioId):null})),costos,hitos,enviar});
   setNotice(enviar?"Cotización enviada al portal del cliente.":"Borrador guardado en PostgreSQL.");setTimeout(()=>nav("/app/admin/cotizaciones"),700);
  }catch(e){setError(e instanceof ApiError?e.message:e instanceof Error?e.message:"No fue posible guardar la cotización.");}finally{setBusy(false);}
 }
 return <div className="space-y-5"><HuTag id="HU-01"/><div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">DPM Operations · Editor persistente</p><h1 className="font-heading text-2xl font-semibold text-ink">Nueva cotización</h1><p className="text-sm text-muted">Construye una propuesta individual según la visita y los costos reales del servicio.</p></div>
 <div className="grid gap-2 overflow-x-auto md:grid-cols-7">{pasos.map((nombre,index)=><button key={nombre} type="button" onClick={()=>{if(index<step||!validarPaso())setStep(index);}} className={`min-w-32 rounded-xl border px-3 py-3 text-left text-xs transition ${index===step?"border-primary bg-primary text-white":"border-line bg-white text-muted hover:border-primary/50"}`}><span className="block font-semibold">0{index+1}</span>{nombre}</button>)}</div>
 <Card><CardHeader><CardTitle>{pasos[step]}</CardTitle></CardHeader><CardContent className="space-y-4">
 {step===0&&<div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Cliente<select className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3" value={clienteId} onChange={e=>{setClienteId(e.target.value);setZonaId("");}}><option value="">Seleccionar cliente</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</select></label><label className="text-sm">Zona<select className="mt-1 h-10 w-full rounded-lg border border-line bg-white px-3" value={zonaId} onChange={e=>setZonaId(e.target.value)}><option value="">Seleccionar zona</option>{zonas.map(z=><option key={z.id} value={z.id}>{z.nombre} · {z.direccion??"Sin dirección"}</option>)}</select></label></div>}
 {step===1&&<div className="grid gap-4 sm:grid-cols-2"><label className="text-sm">Fecha de visita técnica<Input type="date" value={visita} onChange={e=>setVisita(e.target.value)}/></label><label className="text-sm sm:col-span-2">Observaciones de visita<Textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)} placeholder="Hallazgos y condiciones observadas"/></label></div>}
 {step===2&&<div className="grid gap-4"><label className="text-sm">Objeto de la cotización<Input value={objeto} onChange={e=>setObjeto(e.target.value)} placeholder="Ej. Mantenimiento de zona verde"/></label><label className="text-sm">Alcance<Textarea value={alcance} onChange={e=>setAlcance(e.target.value)}/></label><label className="text-sm">Incluye<Textarea value={incluye} onChange={e=>setIncluye(e.target.value)}/></label><label className="text-sm">Duración estimada<Input value={duracion} onChange={e=>setDuracion(e.target.value)} placeholder="Pendiente de confirmar"/></label></div>}
 {step===3&&<div className="space-y-3">{lineas.map((l,i)=><div key={i} className="grid gap-2 rounded-xl border border-line p-3 sm:grid-cols-5"><label className="text-xs sm:col-span-2">Concepto<Input value={l.concepto} onChange={e=>setLineas(p=>p.map((x,j)=>j===i?{...x,concepto:e.target.value}:x))}/></label><label className="text-xs">Servicio<select className="mt-1 h-10 w-full rounded-lg border border-line px-2" value={l.servicioId} onChange={e=>setLineas(p=>p.map((x,j)=>j===i?{...x,servicioId:e.target.value}:x))}><option value="">Manual</option>{servicios.map(s=><option key={s.id} value={s.id}>{s.nombre}</option>)}</select></label><label className="text-xs">Cantidad<Input type="number" min="0.01" value={l.cantidad} onChange={e=>setLineas(p=>p.map((x,j)=>j===i?{...x,cantidad:Number(e.target.value)}:x))}/></label><label className="text-xs">Valor unitario<Input type="number" min="0" value={l.valorUnitario} onChange={e=>setLineas(p=>p.map((x,j)=>j===i?{...x,valorUnitario:Number(e.target.value)}:x))}/></label><div className="flex items-end justify-between sm:col-span-5"><span className="text-sm text-muted">Subtotal {formatCOP(l.cantidad*l.valorUnitario)}</span><Button variant="outline" onClick={()=>setLineas(p=>p.filter((_,j)=>j!==i))}>Quitar</Button></div></div>)}<Button variant="outline" onClick={()=>setLineas(p=>[...p,{concepto:"",cantidad:1,valorUnitario:0,servicioId:""}])}>Agregar concepto</Button></div>}
 {step===4&&<div className="space-y-3"><p className="text-sm text-muted">Información privada para administración; nunca se devuelve al cliente.</p>{costos.map((c,i)=><div key={i} className="grid gap-2 sm:grid-cols-5"><Select value={c.tipo} onChange={e=>setCostos(p=>p.map((x,j)=>j===i?{...x,tipo:e.target.value as TipoCosto}:x))}>{Object.entries(TIPOS_COSTO).map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select><Input placeholder="Descripción" value={c.descripcion} onChange={e=>setCostos(p=>p.map((x,j)=>j===i?{...x,descripcion:e.target.value}:x))}/><Input type="number" min="0.01" value={c.cantidad} onChange={e=>setCostos(p=>p.map((x,j)=>j===i?{...x,cantidad:Number(e.target.value)}:x))}/><Input type="number" min="0" value={c.valorUnitario} onChange={e=>setCostos(p=>p.map((x,j)=>j===i?{...x,valorUnitario:Number(e.target.value)}:x))}/><Button variant="outline" onClick={()=>setCostos(p=>p.filter((_,j)=>j!==i))}>Quitar</Button></div>)}<Button variant="outline" onClick={()=>setCostos(p=>[...p,{tipo:"mano_obra",descripcion:"",cantidad:1,valorUnitario:0}])}>Agregar costo interno</Button></div>}
 {step===5&&<div className="space-y-3">{hitos.map((h,i)=><div key={i} className="flex gap-2"><Input value={h.descripcion} aria-label={`Descripción hito ${i+1}`} onChange={e=>setHitos(p=>p.map((x,j)=>j===i?{...x,descripcion:e.target.value}:x))}/><Input className="max-w-28" type="number" min="0" max="100" value={h.porcentaje} aria-label={`Porcentaje hito ${i+1}`} onChange={e=>setHitos(p=>p.map((x,j)=>j===i?{...x,porcentaje:Number(e.target.value)}:x))}/><Button variant="outline" onClick={()=>setHitos(p=>p.filter((_,j)=>j!==i))}>Quitar</Button></div>)}<Button variant="outline" onClick={()=>setHitos(p=>[...p,{orden:hitos.length+1,descripcion:"",porcentaje:0}])}>Agregar hito</Button><p className={totalHitos===100?"text-primary":"text-status-error"}>Total de hitos: {totalHitos}%</p><label className="text-sm">Vigencia en días<Input type="number" min="1" max="90" value={vigencia} onChange={e=>setVigencia(e.target.value)}/></label></div>}
 {step===6&&<div className="grid gap-4 md:grid-cols-[1fr_280px]"><div className="rounded-xl border border-line bg-white p-5"><p className="text-xs uppercase tracking-[.16em] text-muted">Vista previa</p><h3 className="mt-2 text-xl font-semibold">{objeto||"Sin objeto definido"}</h3><p className="mt-2 text-sm text-muted">{clientes.find(c=>String(c.id)===clienteId)?.nombre} · {zonas.find(z=>String(z.id)===zonaId)?.nombre}</p><p className="mt-5 whitespace-pre-wrap text-sm">{alcance||"Sin alcance descrito."}</p><ul className="mt-5 divide-y divide-line text-sm">{lineas.map((l,i)=><li key={i} className="flex justify-between py-2"><span>{l.concepto||"Concepto sin nombre"} × {l.cantidad}</span><span>{formatCOP(l.cantidad*l.valorUnitario)}</span></li>)}</ul></div><div className="rounded-xl bg-primary p-5 text-white"><p className="text-sm text-white/75">Total al cliente</p><p className="mt-2 text-3xl font-semibold">{formatCOP(total)}</p><p className="mt-5 text-sm text-white/75">Vigencia: {vigencia} días</p><p className="mt-2 text-sm text-white/75">Hitos: {totalHitos}%</p></div></div>}
 {error&&<p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-error">{error}</p>}{notice&&<p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-primary">{notice}</p>}
 <div className="flex flex-wrap justify-between gap-3 border-t border-line pt-4"><Button variant="outline" disabled={step===0||busy} onClick={()=>setStep(s=>s-1)}>Anterior</Button><div className="flex gap-2"><Button variant="outline" disabled={busy} onClick={()=>guardar(false)}>Guardar borrador</Button>{step<pasos.length-1?<Button disabled={busy} onClick={()=>{const message=validarPaso();if(message)setError(message);else setStep(s=>s+1);}}>Continuar</Button>:<Button disabled={busy||totalHitos!==100} onClick={()=>guardar(true)}>{busy?"Guardando…":"Enviar cotización"}</Button>}</div></div>
 </CardContent></Card></div>;
}

function NuevaCotizacionDemo(){
 const {cotizacionId}=useParams();const nav=useNavigate();
 const {clientes,zonas,cotizaciones,crearCotizacion,editarCotizacion,enviarCotizacion}=useApp();
 const existing=cotizaciones.find(c=>c.id===cotizacionId);
 const [clienteId,setClienteId]=useState(existing?.clienteId??clientes[0]?.id??"");
 const zonasDisponibles=zonas.filter(z=>z.clienteId===clienteId);
 const [zonaId,setZonaId]=useState(existing?.zonaId??"");
 const zona=zonasDisponibles.find(z=>z.id===zonaId)??zonasDisponibles[0];
 const [objeto,setObjeto]=useState(existing?.objeto??"");
 const [servicio,setServicio]=useState(existing?.servicio??SERVICIOS_DPM[0]);
 const [fechaVisita,setFechaVisita]=useState(existing?.fechaVisita??"");
 const [observaciones,setObservaciones]=useState(existing?.observaciones??"");
 const [lineas,setLineas]=useState<LineaCotizacion[]>(existing?.lineas??[{id:uid(),concepto:"",unidad:"unidad",cantidad:1,valorUnitario:0}]);
 const [costos,setCostos]=useState<CostoInterno[]>(existing?.costos??[]);
 const [hitos,setHitos]=useState<HitoPago[]>(existing?.hitos??[{id:uid(),descripcion:"Pago único",porcentaje:100}]);
 const [error,setError]=useState("");
 const [enviarId,setEnviarId]=useState<string|null>(null);
 const total=useMemo(()=>totalLineas(lineas),[lineas]);
 const datos={objeto,servicio,fechaVisita:fechaVisita||null,observaciones,lineas,costos,hitos};
 const problema=validarEnvio(datos);
 const editable=!existing||["solicitada","borrador"].includes(existing.estado);
 useEffect(()=>{
  if(!enviarId)return;
  const registro=cotizaciones.find(c=>c.id===enviarId);
  if(!registro||registro.lineas!==lineas)return;
  const resultado=enviarCotizacion(enviarId);
  if(resultado.ok)nav("/app/admin/cotizaciones");
  else {setError(resultado.error);setEnviarId(null);}
 },[enviarId,cotizaciones,lineas,enviarCotizacion,nav]);
 function guardar(enviar=false){
  setError("");
  if(!zona||!objeto.trim()){setError("Selecciona una zona e indica el objeto.");return;}
  if(!lineas.every(l=>l.concepto.trim()&&l.unidad.trim()&&Number.isFinite(l.cantidad)&&l.cantidad>0&&Number.isFinite(l.valorUnitario)&&l.valorUnitario>=0)){setError("Revisa los conceptos, cantidades y precios.");return;}
  if(!costos.every(c=>c.concepto.trim()&&Number.isFinite(c.cantidad)&&c.cantidad>0&&Number.isFinite(c.valorUnitario)&&c.valorUnitario>=0)){setError("Revisa los costos internos.");return;}
  if(enviar&&problema){setError(problema);return;}
  let id=existing?.id;
  if(existing){editarCotizacion(existing.id,datos);}
  else id=crearCotizacion({...datos,clienteId,zonaId:zona.id,zonaNombre:zona.nombre,estado:"borrador",origen:"administrador"}).id;
  if(enviar)setEnviarId(id??null);else nav("/app/admin/cotizaciones");
 }
 return <div className="relative space-y-5"><HuTag id="HU-01"/><div><h1 className="font-heading text-2xl font-semibold text-ink">{existing?"Elaborar cotización":"Nueva cotización"}</h1><p className="text-sm text-muted">Prototipo con valores ficticios, sin conexión a la API.</p></div>
 {!editable?<Card><CardContent className="p-5">Las cotizaciones enviadas no pueden editarse.</CardContent></Card>:<>
 <Card><CardHeader><CardTitle>Datos y visita técnica</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-2">
 <label className="text-sm">Cliente<Select value={clienteId} disabled={!!existing} onChange={e=>{setClienteId(e.target.value);setZonaId("");}}>{clientes.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</Select></label>
 <label className="text-sm">Zona<Select value={zona?.id??""} disabled={!!existing} onChange={e=>setZonaId(e.target.value)}>{zonasDisponibles.map(z=><option key={z.id} value={z.id}>{z.nombre}</option>)}</Select></label>
 <label className="text-sm">Servicio<Select value={servicio} onChange={e=>setServicio(e.target.value)}>{SERVICIOS_DPM.map(s=><option key={s}>{s}</option>)}</Select></label>
 <label className="text-sm">Fecha de visita técnica<Input type="date" value={fechaVisita} onChange={e=>setFechaVisita(e.target.value)}/></label>
 <label className="text-sm sm:col-span-2">Objeto de cotización<Input value={objeto} onChange={e=>setObjeto(e.target.value)} placeholder="Descripción del trabajo"/></label>
 <label className="text-sm sm:col-span-2">Observaciones<Textarea value={observaciones} onChange={e=>setObservaciones(e.target.value)}/></label>
 </CardContent></Card>
 <Card><CardHeader><CardTitle>Conceptos de cobro</CardTitle></CardHeader><CardContent className="space-y-3">
 {lineas.map((l,i)=><div key={l.id} className="grid gap-2 rounded-lg border border-line p-3 sm:grid-cols-4">
 <label className="text-xs">Concepto<Input aria-label={"Concepto "+i} value={l.concepto} onChange={e=>setLineas(p=>p.map(v=>v.id===l.id?{...v,concepto:e.target.value}:v))}/></label>
 <label className="text-xs">Unidad<Input value={l.unidad} onChange={e=>setLineas(p=>p.map(v=>v.id===l.id?{...v,unidad:e.target.value}:v))}/></label>
 <label className="text-xs">Cantidad<Input type="number" min="0.01" step="any" value={l.cantidad} onChange={e=>setLineas(p=>p.map(v=>v.id===l.id?{...v,cantidad:Number(e.target.value)}:v))}/></label>
 <label className="text-xs">Valor unitario<Input type="number" min="0" step="any" value={l.valorUnitario} onChange={e=>setLineas(p=>p.map(v=>v.id===l.id?{...v,valorUnitario:Number(e.target.value)}:v))}/></label>
 <p className="text-sm sm:col-span-3">Subtotal {formatCOP(l.cantidad*l.valorUnitario)}</p><Button size="sm" variant="outline" onClick={()=>setLineas(p=>p.filter(v=>v.id!==l.id))}>Eliminar</Button>
 </div>)}<Button variant="outline" onClick={()=>setLineas(p=>[...p,{id:uid(),concepto:"",unidad:"unidad",cantidad:1,valorUnitario:0}])}>Agregar concepto</Button>
 </CardContent></Card>
 <Card><CardHeader><CardTitle>Forma de pago</CardTitle></CardHeader><CardContent className="space-y-3">
 {hitos.map(h=><div key={h.id} className="flex gap-2"><Input aria-label="Hito" value={h.descripcion} onChange={e=>setHitos(p=>p.map(v=>v.id===h.id?{...v,descripcion:e.target.value}:v))}/><Input className="max-w-28" aria-label="Porcentaje" type="number" min={0} max={100} value={h.porcentaje} onChange={e=>setHitos(p=>p.map(v=>v.id===h.id?{...v,porcentaje:Number(e.target.value)}:v))}/><Button variant="outline" onClick={()=>setHitos(p=>p.filter(v=>v.id!==h.id))}>Quitar</Button></div>)}
 <Button variant="outline" onClick={()=>setHitos(p=>[...p,{id:uid(),descripcion:"",porcentaje:0}])}>Agregar hito</Button><p className={sumaHitos(hitos)===100?"text-primary":"text-status-error"}>Total: {sumaHitos(hitos)} %</p>
 </CardContent></Card>
 <Card><CardHeader><CardTitle>Análisis interno de costos</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs text-muted">No es visible para el cliente.</p>
 {costos.map(c=><div key={c.id} className="grid gap-2 sm:grid-cols-5"><Select value={c.tipo} onChange={e=>setCostos(p=>p.map(v=>v.id===c.id?{...v,tipo:e.target.value as TipoCosto}:v))}>{Object.entries(TIPOS_COSTO).map(([v,t])=><option key={v} value={v}>{t}</option>)}</Select><Input aria-label="Concepto de costo" value={c.concepto} onChange={e=>setCostos(p=>p.map(v=>v.id===c.id?{...v,concepto:e.target.value}:v))}/><Input aria-label="Cantidad del costo" type="number" min="0.01" step="any" value={c.cantidad} onChange={e=>setCostos(p=>p.map(v=>v.id===c.id?{...v,cantidad:Number(e.target.value)}:v))}/><Input aria-label="Valor del costo" type="number" min="0" value={c.valorUnitario} onChange={e=>setCostos(p=>p.map(v=>v.id===c.id?{...v,valorUnitario:Number(e.target.value)}:v))}/><Button variant="outline" onClick={()=>setCostos(p=>p.filter(v=>v.id!==c.id))}>Quitar</Button></div>)}
 <Button variant="outline" onClick={()=>setCostos(p=>[...p,{id:uid(),tipo:"mano_obra",concepto:"",cantidad:1,valorUnitario:0}])}>Agregar costo</Button><p className="text-sm">Costo estimado: {formatCOP(totalCostos(costos))}</p>
 </CardContent></Card>
 <Card><CardContent className="space-y-3 p-5"><p className="text-xl font-semibold">Total al cliente: {formatCOP(total)}</p><p className="text-sm text-muted">Vigencia desde el envío: 15 días.</p>{error&&<p role="alert" className="text-status-error">{error}</p>}<div className="flex gap-3"><Button variant="outline" onClick={()=>guardar(false)}>Guardar borrador</Button><Button disabled={!!problema} onClick={()=>guardar(true)}>Enviar cotización</Button></div></CardContent></Card>
 </>}</div>;
}

