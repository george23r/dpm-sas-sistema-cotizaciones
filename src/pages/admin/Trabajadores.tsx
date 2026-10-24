import {useState} from "react";
import {useApp} from "@/context/AppContext";
import {Card,CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Select} from "@/components/ui/select";
import {Button} from "@/components/ui/button";
import {HuTag} from "@/components/shared/HuTag";
import type {Operario} from "@/types";
export function Trabajadores(){
 const {operarios,cuadrillas,ordenes,guardarOperario}=useApp();
 const limpio=()=>({nombre:"",cuadrillaId:cuadrillas[0]?.id??"",esLider:false,activo:true});
 const [datos,setDatos]=useState(limpio);const [editId,setEditId]=useState<string|undefined>();const [error,setError]=useState("");const [ok,setOk]=useState("");
 function editar(o:Operario){setDatos({nombre:o.nombre,cuadrillaId:o.cuadrillaId,esLider:o.esLider,activo:o.activo});setEditId(o.id);setError("");setOk("");}
 function guardar(e:React.FormEvent){e.preventDefault();const r=guardarOperario(datos,editId);if(!r.ok){setError(r.error);return;}setError("");setOk(editId?"Trabajador actualizado":"Trabajador registrado");setDatos(limpio());setEditId(undefined);}
 return <div className="space-y-5"><HuTag id="HU-04"/><h1 className="font-heading text-2xl font-semibold">Gestión de trabajadores</h1><p className="text-sm text-muted">Personal ficticio y asignación a cuadrillas; la disponibilidad real se valida con el horario de órdenes.</p>
 <Card><CardContent className="space-y-3 p-5"><h2 className="font-semibold">{editId?"Editar trabajador":"Registrar trabajador"}</h2><form onSubmit={guardar} className="grid gap-3 sm:grid-cols-3">
 <label className="text-sm">Nombre<Input required value={datos.nombre} onChange={e=>setDatos(x=>({...x,nombre:e.target.value}))}/></label>
 <label className="text-sm">Cuadrilla<Select value={datos.cuadrillaId} onChange={e=>setDatos(x=>({...x,cuadrillaId:e.target.value}))}>{cuadrillas.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}</Select></label>
 <div className="flex flex-col justify-center gap-2 text-sm"><label><input type="checkbox" checked={datos.esLider} onChange={e=>setDatos(x=>({...x,esLider:e.target.checked}))}/> Líder de cuadrilla</label><label><input type="checkbox" checked={datos.activo} onChange={e=>setDatos(x=>({...x,activo:e.target.checked}))}/> Activo</label></div>
 <div className="flex gap-2"><Button type="submit">{editId?"Guardar":"Agregar"}</Button>{editId&&<Button variant="outline" type="button" onClick={()=>{setEditId(undefined);setDatos(limpio())}}>Cancelar</Button>}</div>
 </form>{error&&<p role="alert" className="text-sm text-status-error">{error}</p>}{ok&&<p role="status" className="text-sm text-primary">{ok}</p>}</CardContent></Card>
 <Card><CardContent className="overflow-x-auto p-4"><table className="w-full text-left text-sm"><thead><tr className="border-b border-line">{["Trabajador","Cuadrilla","Rol","Estado","Órdenes próximas","Acción"].map(v=><th className="p-2" key={v}>{v}</th>)}</tr></thead><tbody>{operarios.map(o=><tr key={o.id} className="border-b border-line"><td className="p-2">{o.nombre}</td><td className="p-2">{cuadrillas.find(c=>c.id===o.cuadrillaId)?.nombre}</td><td className="p-2">{o.esLider?"Líder":"Integrante"}</td><td className="p-2">{o.activo?"Activo":"Inactivo"}</td><td className="p-2">{ordenes.filter(x=>x.cuadrillaId===o.cuadrillaId&&x.estado!=="finalizado").length}</td><td className="p-2"><Button variant="outline" size="sm" onClick={()=>editar(o)}>Editar</Button></td></tr>)}</tbody></table></CardContent></Card></div>;
}
