import { Clock, Loader2, CheckCircle2, XCircle, FilePenLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ESTADOS_COTIZACION, ESTADOS_ORDEN, type EstadoCotizacion, type EstadoOrden } from "@/types";
const COTIZACION_CONFIG: Record<EstadoCotizacion, {variant:"pendiente"|"progreso"|"finalizado"|"error";icon:typeof Clock}>={
 solicitada:{variant:"pendiente",icon:Clock},borrador:{variant:"pendiente",icon:FilePenLine},
 enviada:{variant:"progreso",icon:Loader2},aceptada:{variant:"finalizado",icon:CheckCircle2},rechazada:{variant:"error",icon:XCircle}
};
const ORDEN_CONFIG: Record<EstadoOrden,{variant:"pendiente"|"progreso"|"finalizado"|"error";icon:typeof Clock}>={
 pendiente:{variant:"pendiente",icon:Clock},en_ejecucion:{variant:"progreso",icon:Loader2},finalizado:{variant:"finalizado",icon:CheckCircle2}
};
export function EstadoCotizacionBadge({estado}:{estado:EstadoCotizacion}){const {variant,icon:Icon}=COTIZACION_CONFIG[estado];return <Badge variant={variant}><Icon className="size-3"/>{ESTADOS_COTIZACION[estado]}</Badge>;}
export function EstadoOrdenBadge({estado}:{estado:EstadoOrden}){const {variant,icon:Icon}=ORDEN_CONFIG[estado];return <Badge variant={variant}><Icon className="size-3"/>{ESTADOS_ORDEN[estado]}</Badge>;}
