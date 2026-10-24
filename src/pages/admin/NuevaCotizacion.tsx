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
let seq=0;const uid=()=>String(++seq);
export function NuevaCotizacion(){
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
