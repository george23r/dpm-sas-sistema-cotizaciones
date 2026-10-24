export type OrigenPlanilla = "campo" | "administrativa";
export type EstadoPlanilla = "borrador" | "en_comparacion" | "conciliada";
export interface Planilla {id:string;clienteId:string;desde:string;hasta:string;origen:OrigenPlanilla;estado:EstadoPlanilla}
export interface Jornada {id:string;planillaId:string;trabajador:string;fecha:string;zonaId:string;labor:string;inicio:string;fin:string;descansoMin:number;festivo:boolean}
export interface Comparacion {clave:string;trabajador:string;fecha:string;campo:number|null;administrativa:number|null;diferencia:number;resultado:"coincide"|"diferente"|"solo_campo"|"solo_administrativa"}
export const horasJornada=(j:Pick<Jornada,"inicio"|"fin"|"descansoMin">):number=>{
 const parse=(s:string)=>{if(!/^([01]\d|2[0-3]):[0-5]\d$/.test(s))return NaN;const [h,m]=s.split(":").map(Number);return h*60+m};
 const a=parse(j.inicio),b=parse(j.fin),d=j.descansoMin;
 if(!Number.isFinite(a)||!Number.isFinite(b)||a===b||!Number.isFinite(d)||d<0)return NaN;
 const minutos=((b<a?b+1440:b)-a)-d;
 return minutos>0?Math.round(minutos/60*100)/100:NaN;
};
export function compararPlanillas(registros:Jornada[],campoId:string,adminId:string):Comparacion[]{
 const por=new Map<string,{trabajador:string;fecha:string;campo:number|null;administrativa:number|null}>();
 for(const r of registros.filter(r=>r.planillaId===campoId||r.planillaId===adminId)){
 const clave=r.trabajador.trim().toLowerCase()+"|"+r.fecha;
 const fila=por.get(clave)??{trabajador:r.trabajador,fecha:r.fecha,campo:null,administrativa:null};
 const k=r.planillaId===campoId?"campo":"administrativa";
 fila[k]=Math.round(((fila[k]??0)+horasJornada(r))*100)/100;
 por.set(clave,fila);
 }
 return [...por.entries()].map(([clave,r])=>({...r,clave,diferencia:Math.round(((r.campo??0)-(r.administrativa??0))*100)/100,resultado:(r.campo===null?"solo_administrativa":r.administrativa===null?"solo_campo":Math.abs(r.campo-r.administrativa)<0.005?"coincide":"diferente") as Comparacion["resultado"]})).sort((a,b)=>a.fecha.localeCompare(b.fecha)||a.trabajador.localeCompare(b.trabajador));
}
export const demoPlanillas:Planilla[]=[
 {id:"p-campo-01",clienteId:"cli-01",desde:"2026-10-01",hasta:"2026-10-15",origen:"campo",estado:"borrador"},
 {id:"p-admin-01",clienteId:"cli-01",desde:"2026-10-01",hasta:"2026-10-15",origen:"administrativa",estado:"borrador"},
];
export const demoJornadas:Jornada[]=[
 {id:"j-1",planillaId:"p-campo-01",trabajador:"Operario A (ficticio)",fecha:"2026-10-07",zonaId:"zon-01",labor:"Poda",inicio:"18:00",fin:"06:00",descansoMin:0,festivo:false},
 {id:"j-2",planillaId:"p-admin-01",trabajador:"Operario A (ficticio)",fecha:"2026-10-07",zonaId:"zon-01",labor:"Poda",inicio:"18:00",fin:"06:00",descansoMin:0,festivo:false},
 {id:"j-3",planillaId:"p-campo-01",trabajador:"Operario B (ficticio)",fecha:"2026-10-08",zonaId:"zon-01",labor:"Limpieza",inicio:"06:00",fin:"14:00",descansoMin:0,festivo:false},
 {id:"j-4",planillaId:"p-admin-01",trabajador:"Operario B (ficticio)",fecha:"2026-10-08",zonaId:"zon-01",labor:"Limpieza",inicio:"06:00",fin:"12:00",descansoMin:0,festivo:false},
];
