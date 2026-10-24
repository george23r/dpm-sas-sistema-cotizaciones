import {useState} from "react";
import {useApp} from "@/context/AppContext";
import {Card,CardContent} from "@/components/ui/card";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {HuTag} from "@/components/shared/HuTag";
import type {Cliente} from "@/types";
const vacio={nombre:"",correo:"",telefono:""};
export function Clientes(){
 const {clientes,guardarCliente,zonas,cotizaciones}=useApp();
 const [editId,setEditId]=useState<string|undefined>();
 const [datos,setDatos]=useState(vacio);const [error,setError]=useState("");const [ok,setOk]=useState("");
 function editar(c:Cliente){setEditId(c.id);setDatos({nombre:c.nombre,correo:c.correo,telefono:c.telefono});setError("");setOk("");}
 function guardar(e:React.FormEvent){e.preventDefault();const r=guardarCliente(datos,editId);if(!r.ok){setError(r.error);return;}setError("");setOk(editId?"Cliente actualizado":"Cliente registrado");setEditId(undefined);setDatos(vacio);}
 return <div className="space-y-5"><HuTag id="HU-02"/><div><h1 className="font-heading text-2xl font-semibold">Gestión de clientes</h1><p className="text-sm text-muted">Catálogo administrativo de demostración. Los cambios no se guardan en PostgreSQL.</p></div>
 <Card><CardContent className="space-y-3 p-5"><h2 className="font-semibold">{editId?"Editar cliente":"Nuevo cliente"}</h2><form onSubmit={guardar} className="grid gap-3 sm:grid-cols-4">
 <label className="text-sm">Nombre<Input required value={datos.nombre} onChange={e=>setDatos(x=>({...x,nombre:e.target.value}))}/></label>
 <label className="text-sm">Correo<Input required type="email" value={datos.correo} onChange={e=>setDatos(x=>({...x,correo:e.target.value}))}/></label>
 <label className="text-sm">Teléfono<Input required value={datos.telefono} onChange={e=>setDatos(x=>({...x,telefono:e.target.value}))}/></label>
 <div className="flex items-end gap-2"><Button type="submit">{editId?"Guardar":"Agregar"}</Button>{editId&&<Button type="button" variant="outline" onClick={()=>{setEditId(undefined);setDatos(vacio)}}>Cancelar</Button>}</div>
 </form>{error&&<p role="alert" className="text-sm text-status-error">{error}</p>}{ok&&<p role="status" className="text-sm text-primary">{ok}</p>}</CardContent></Card>
 <Card><CardContent className="overflow-x-auto p-4"><table className="w-full text-left text-sm"><thead><tr className="border-b border-line">{["Cliente","Correo","Teléfono","Zonas","Cotizaciones","Acción"].map(x=><th key={x} className="p-2">{x}</th>)}</tr></thead><tbody>{clientes.map(c=><tr className="border-b border-line" key={c.id}><td className="p-2 font-medium">{c.nombre}</td><td className="p-2">{c.correo}</td><td className="p-2">{c.telefono}</td><td className="p-2">{zonas.filter(z=>z.clienteId===c.id).length}</td><td className="p-2">{cotizaciones.filter(q=>q.clienteId===c.id).length}</td><td className="p-2"><Button size="sm" variant="outline" onClick={()=>editar(c)}>Editar</Button></td></tr>)}</tbody></table></CardContent></Card></div>;
}
