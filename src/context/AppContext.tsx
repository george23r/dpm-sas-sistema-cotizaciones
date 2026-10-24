import * as React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type { Cliente, Operario, Cotizacion, EstadoOrden, OrdenTrabajo, Rol } from "@/types";
import { clientes, CLIENTE_DEMO_ID } from "@/data/clientes";
import { zonas } from "@/data/zonas";
import { cuadrillas, OPERARIO_DEMO_CUADRILLA_ID, OPERARIO_DEMO_NOMBRE } from "@/data/cuadrillas";
import { operariosSeed } from "@/data/operarios";
import { validarCliente, validarOperario } from "@/lib/validacionesAdmin";
import { cotizacionesSeed } from "@/data/cotizaciones";
import { ordenesSeed } from "@/data/ordenes";
import { compararPlanillas, demoPlanillas, demoJornadas, horasJornada, type Planilla, type Jornada } from "@/lib/jornadas";
import { cotizacionVigente, totalLineas, validarEnvio } from "@/lib/cotizaciones";

type NuevaCotizacionInput = Omit<Cotizacion, "id"|"fechaSolicitud"|"fechaEnvio"|"precio"|"vigenciaDias">;
interface ProgramarOrdenInput {cotizacionId:string|null;clienteId:string;zonaId:string;zonaNombre:string;direccion:string;tipoServicio:string;fecha:string;horaInicio:string;horaFin:string;cuadrillaId:string|null}
interface FinalizarOrdenInput { nota?:string }
interface AppContextValue {
 rol:Rol;setRol:(r:Rol)=>void;autenticado:boolean;iniciarSesion:()=>void;cerrarSesion:()=>void;mostrarHU:boolean;alternarHU:()=>void;
 clientes:Cliente[];operarios:Operario[];zonas:typeof zonas;cuadrillas:typeof cuadrillas;
 guardarCliente:(input:Omit<Cliente,"id">,id?:string)=>{ok:true}|{ok:false;error:string};
 guardarOperario:(input:Omit<Operario,"id">,id?:string)=>{ok:true}|{ok:false;error:string};clienteActualId:string;cuadrillaActualId:string;operarioActualNombre:string;
 cotizaciones:Cotizacion[];
 crearCotizacion:(input:NuevaCotizacionInput)=>Cotizacion;
 editarCotizacion:(id:string,input:Pick<Cotizacion,"objeto"|"servicio"|"fechaVisita"|"lineas"|"costos"|"hitos"|"observaciones">)=>void;
 enviarCotizacion:(id:string)=>{ok:true}|{ok:false;error:string};
 responderCotizacion:(id:string,aceptar:boolean)=>{ok:true}|{ok:false;error:string};
 planillas:Planilla[]; jornadas:Jornada[];
 crearParejaPlanillas:(clienteId:string,desde:string,hasta:string)=>{ok:true;campoId:string;adminId:string}|{ok:false;error:string};
 agregarJornada:(input:Omit<Jornada,"id">)=>{ok:true}|{ok:false;error:string};
 conciliarPlanillas:(campoId:string,adminId:string)=>{ok:true}|{ok:false;error:string};
 ordenes:OrdenTrabajo[];
 crearOrden:(input:ProgramarOrdenInput)=>{ok:true;orden:OrdenTrabajo}|{ok:false;error:string};
 asignarCuadrillaAOrden:(ordenId:string,cuadrillaId:string)=>{ok:true}|{ok:false;error:string};
 cambiarEstadoOrden:(ordenId:string,estado:EstadoOrden)=>void;
 finalizarOrden:(ordenId:string,input:FinalizarOrdenInput)=>void;
}
const AppContext=createContext<AppContextValue|null>(null);
let contador=100;
function nuevoId(prefijo:string){contador+=1;return prefijo+"-"+contador;}
function haySolape(a:string,b:string,c:string,d:string){return a<d&&c<b;}
export function AppProvider({children}:{children:React.ReactNode}){
 const [listaClientes,setListaClientes]=useState<Cliente[]>(clientes);
 const [operarios,setOperarios]=useState<Operario[]>(operariosSeed);
 const [rol,setRol]=useState<Rol>("cliente");const [autenticado,setAutenticado]=useState(false);const [mostrarHU,setMostrarHU]=useState(true);
 const [cotizaciones,setCotizaciones]=useState<Cotizacion[]>(cotizacionesSeed);
 const [ordenes,setOrdenes]=useState<OrdenTrabajo[]>(ordenesSeed);
 const [planillas,setPlanillas]=useState<Planilla[]>(demoPlanillas);
 const [jornadas,setJornadas]=useState<Jornada[]>(demoJornadas);
 const guardarCliente:AppContextValue["guardarCliente"]=(input,id)=>{
  const error=validarCliente(input,listaClientes,id);
  if(error)return {ok:false,error};
  if(id&&!listaClientes.some(c=>c.id===id))return {ok:false,error:"Cliente inexistente."};
  setListaClientes(prev=>id?prev.map(c=>c.id===id?{...input,id}:c):[...prev,{...input,id:nuevoId("cli")}]);
  return {ok:true};
 };
 const guardarOperario:AppContextValue["guardarOperario"]=(input,id)=>{
  const error=validarOperario(input,operarios,cuadrillas.map(c=>c.id),id);
  if(error)return {ok:false,error};
  if(id&&!operarios.some(o=>o.id===id))return {ok:false,error:"Trabajador inexistente."};
  setOperarios(prev=>id?prev.map(o=>o.id===id?{...input,id}:o):[...prev,{...input,id:nuevoId("op")}]);
  return {ok:true};
 };
 const crearCotizacion=(input:NuevaCotizacionInput):Cotizacion=>{
  const nueva:Cotizacion={...input,id:nuevoId("cot"),fechaSolicitud:new Date().toLocaleDateString("en-CA",{timeZone:"America/Bogota"}),fechaEnvio:null,vigenciaDias:15,precio:input.estado==="solicitada"?null:totalLineas(input.lineas)};
  setCotizaciones(prev=>[nueva,...prev]);return nueva;
 };
 const editarCotizacion:AppContextValue["editarCotizacion"]=(id,input)=>setCotizaciones(prev=>prev.map(c=>c.id===id&&["solicitada","borrador"].includes(c.estado)?{...c,...input,estado:"borrador",precio:totalLineas(input.lineas)}:c));
 const enviarCotizacion:AppContextValue["enviarCotizacion"]=(id)=>{
  const c=cotizaciones.find(x=>x.id===id);
  if(!c)return {ok:false,error:"Cotización no encontrada."};
  if(!["solicitada","borrador"].includes(c.estado))return {ok:false,error:"Esta cotización ya no se puede enviar."};
  const error=validarEnvio(c);if(error)return {ok:false,error};
  setCotizaciones(prev=>prev.map(x=>x.id===id?{...x,estado:"enviada",precio:totalLineas(x.lineas),fechaEnvio:new Date().toLocaleDateString("en-CA",{timeZone:"America/Bogota"})}:x));
  return {ok:true};
 };
 const responderCotizacion:AppContextValue["responderCotizacion"]=(id,aceptar)=>{
  const c=cotizaciones.find(x=>x.id===id);if(!c)return {ok:false,error:"Cotización no encontrada."};
  if(!cotizacionVigente(c))return {ok:false,error:"La cotización no está enviada o ya venció."};
  setCotizaciones(prev=>prev.map(x=>x.id===id?{...x,estado:aceptar?"aceptada":"rechazada"}:x));return {ok:true};
 };
 const crearOrden:AppContextValue["crearOrden"]=(input)=>{
  const cotizacion=cotizaciones.find(c=>c.id===input.cotizacionId);
  if(!cotizacion||cotizacion.estado!=="aceptada")return {ok:false,error:"Solo se pueden programar servicios de cotizaciones aceptadas."};
  if(cotizacion.clienteId!==input.clienteId||cotizacion.zonaId!==input.zonaId)return {ok:false,error:"Los datos del servicio no coinciden con la cotización aceptada."};
  if(!zonas.some(z=>z.id===input.zonaId&&z.clienteId===input.clienteId))return {ok:false,error:"La zona no pertenece al cliente."};
  if(!/^\d{4}-\d{2}-\d{2}$/.test(input.fecha)||Number.isNaN(new Date(input.fecha+"T12:00:00Z").valueOf()))return {ok:false,error:"Selecciona una fecha válida."};
  if(!/^\d{2}:\d{2}$/.test(input.horaInicio)||!/^\d{2}:\d{2}$/.test(input.horaFin)||input.horaFin<=input.horaInicio)return {ok:false,error:"La hora de fin debe ser posterior al inicio."};
  if(!input.tipoServicio.trim())return {ok:false,error:"Selecciona el servicio."};
  if(input.cuadrillaId&&!cuadrillas.some(c=>c.id===input.cuadrillaId))return {ok:false,error:"La cuadrilla no existe."};
  if(input.cuadrillaId&&ordenes.some(o=>o.cuadrillaId===input.cuadrillaId&&o.fecha===input.fecha&&o.estado!=="finalizado"&&haySolape(o.horaInicio,o.horaFin,input.horaInicio,input.horaFin)))return {ok:false,error:"La cuadrilla ya tiene un servicio asignado en este horario."};
  const orden:OrdenTrabajo={...input,id:nuevoId("ord"),estado:"pendiente"};
  setOrdenes(prev=>[...prev,orden]);
  return {ok:true,orden};
 };
 const asignarCuadrillaAOrden:AppContextValue["asignarCuadrillaAOrden"]=(ordenId,cuadrillaId)=>{
  const orden=ordenes.find(x=>x.id===ordenId);
  if(!orden)return {ok:false,error:"Orden no encontrada."};
  if(orden.estado!=="pendiente")return {ok:false,error:"Solo pueden reasignarse órdenes pendientes."};
  if(!cuadrillas.some(c=>c.id===cuadrillaId))return {ok:false,error:"La cuadrilla no existe."};
  if(ordenes.some(o=>o.id!==ordenId&&o.cuadrillaId===cuadrillaId&&o.fecha===orden.fecha&&o.estado!=="finalizado"&&haySolape(o.horaInicio,o.horaFin,orden.horaInicio,orden.horaFin)))return {ok:false,error:"La cuadrilla ya tiene un servicio asignado en este horario."};
  setOrdenes(prev=>prev.map(o=>o.id===ordenId?{...o,cuadrillaId}:o));return {ok:true};
 };
 const cambiarEstadoOrden:AppContextValue["cambiarEstadoOrden"]=(id,estado)=>{
   if(estado!=="en_ejecucion")return;
   setOrdenes(prev=>prev.map(o=>o.id===id&&o.estado==="pendiente"&&o.cuadrillaId===OPERARIO_DEMO_CUADRILLA_ID?{...o,estado}:o));
 };
 const finalizarOrden:AppContextValue["finalizarOrden"]=(id,input)=>{
   const d=new Date();
   setOrdenes(prev=>prev.map(o=>o.id===id&&o.estado==="en_ejecucion"&&o.cuadrillaId===OPERARIO_DEMO_CUADRILLA_ID?{
     ...o,estado:"finalizado",finalizacion:{fecha:d.toLocaleDateString("en-CA",{timeZone:"America/Bogota"}),hora:d.toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit",hour12:false,timeZone:"America/Bogota"}),responsable:OPERARIO_DEMO_NOMBRE,nota:input.nota}
   }:o));
 };
 const crearParejaPlanillas:AppContextValue["crearParejaPlanillas"]=(clienteId,desde,hasta)=>{
 if(!clientes.some(c=>c.id===clienteId)||!/^\d{4}-\d{2}-\d{2}$/.test(desde)||!/^\d{4}-\d{2}-\d{2}$/.test(hasta)||desde>hasta)return {ok:false,error:"Cliente o periodo inválido."};
 if(planillas.some(p=>p.clienteId===clienteId&&p.desde===desde&&p.hasta===hasta))return {ok:false,error:"Ya existen planillas para este cliente y periodo."};
 const campoId=nuevoId("campo"),adminId=nuevoId("admin");
 setPlanillas(p=>[...p,{id:campoId,clienteId,desde,hasta,origen:"campo",estado:"borrador"},{id:adminId,clienteId,desde,hasta,origen:"administrativa",estado:"borrador"}]);
 return {ok:true,campoId,adminId};
 };
 const agregarJornada:AppContextValue["agregarJornada"]=(input)=>{
 const planilla=planillas.find(p=>p.id===input.planillaId);
 if(!planilla||planilla.estado==="conciliada")return {ok:false,error:"La planilla no existe o ya fue conciliada."};
 if(input.fecha<planilla.desde||input.fecha>planilla.hasta)return {ok:false,error:"Fecha fuera del periodo."};
 if(!zonas.some(z=>z.id===input.zonaId&&z.clienteId===planilla.clienteId))return {ok:false,error:"La zona no corresponde al cliente."};
 if(!input.trabajador.trim()||!input.labor.trim()||!Number.isFinite(horasJornada(input)))return {ok:false,error:"Datos de jornada inválidos."};
 if(jornadas.some(j=>j.planillaId===input.planillaId&&j.trabajador.toLowerCase()===input.trabajador.trim().toLowerCase()&&j.fecha===input.fecha&&j.inicio===input.inicio))return {ok:false,error:"Jornada duplicada."};
 setJornadas(p=>[...p,{...input,id:nuevoId("j")}]);return {ok:true};
 };
 const conciliarPlanillas:AppContextValue["conciliarPlanillas"]=(campoId,adminId)=>{
 const campo=planillas.find(p=>p.id===campoId),admin=planillas.find(p=>p.id===adminId);
 if(!campo||!admin||campo.origen!=="campo"||admin.origen!=="administrativa"||campo.clienteId!==admin.clienteId||campo.desde!==admin.desde||campo.hasta!==admin.hasta)return {ok:false,error:"La pareja de planillas no corresponde al mismo cliente y periodo."};
 if(campo.estado==="conciliada"||admin.estado==="conciliada")return {ok:false,error:"Planillas ya conciliadas."};
 const comparacion=compararPlanillas(jornadas,campoId,adminId);
 if(!comparacion.length||comparacion.some(r=>r.resultado!=="coincide")){setPlanillas(p=>p.map(x=>x.id===campoId||x.id===adminId?{...x,estado:"en_comparacion"}:x));return {ok:false,error:"Existen diferencias o faltan registros; revisa antes de conciliar."};}
 setPlanillas(p=>p.map(x=>x.id===campoId||x.id===adminId?{...x,estado:"conciliada"}:x));return {ok:true};
 };
 const value=useMemo<AppContextValue>(()=>({rol,setRol,autenticado,iniciarSesion:()=>setAutenticado(true),cerrarSesion:()=>setAutenticado(false),mostrarHU,alternarHU:()=>setMostrarHU(v=>!v),clientes:listaClientes,operarios,guardarCliente,guardarOperario,zonas,cuadrillas,clienteActualId:CLIENTE_DEMO_ID,cuadrillaActualId:OPERARIO_DEMO_CUADRILLA_ID,operarioActualNombre:OPERARIO_DEMO_NOMBRE,planillas,jornadas,crearParejaPlanillas,agregarJornada,conciliarPlanillas,cotizaciones,crearCotizacion,editarCotizacion,enviarCotizacion,responderCotizacion,ordenes,crearOrden,asignarCuadrillaAOrden,cambiarEstadoOrden,finalizarOrden}),[rol,autenticado,mostrarHU,cotizaciones,ordenes,planillas,jornadas,listaClientes,operarios]);
 return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
export function useApp(){const c=useContext(AppContext);if(!c)throw new Error("useApp debe usarse dentro de AppProvider");return c;}
