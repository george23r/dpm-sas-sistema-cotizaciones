export type Rol = "cliente" | "administrador" | "operario";

// Estos catálogos históricos describen algunas zonas del prototipo, NO calculan cotizaciones.
export type TipoVegetacion = "cesped_simple" | "jardin_ornamental" | "zona_arborizada" | "mixta";
export const TIPOS_VEGETACION: Record<TipoVegetacion, string> = {
  cesped_simple: "Césped simple",
  jardin_ornamental: "Jardín ornamental",
  zona_arborizada: "Zona arborizada",
  mixta: "Mixta",
};
export type Frecuencia = "unica" | "mensual" | "quincenal" | "semanal";
export const FRECUENCIAS: Record<Frecuencia, string> = {
  unica: "Única vez", mensual: "Mensual", quincenal: "Quincenal", semanal: "Semanal",
};
export type Equipo = "guadañadora" | "motosierra" | "fumigadora";
export const EQUIPOS: Record<Equipo, string> = {
  guadañadora: "Guadañadora", motosierra: "Motosierra", fumigadora: "Fumigadora",
};

export const SERVICIOS_DPM = [
  "Poda de árboles",
  "Resiembra con macollo",
  "Resiembra con semilla",
  "Control de limpieza manual",
  "Rectificación de encalle manual",
  "Riego en situaciones de sequía",
  "Fumigación manual",
] as const;

export type EstadoCotizacion = "solicitada" | "borrador" | "enviada" | "aceptada" | "rechazada";
export const ESTADOS_COTIZACION: Record<EstadoCotizacion, string> = {
  solicitada: "Solicitada", borrador: "Borrador", enviada: "Enviada",
  aceptada: "Aceptada", rechazada: "Rechazada",
};
export type EstadoOrden = "pendiente" | "en_ejecucion" | "finalizado";
export const ESTADOS_ORDEN: Record<EstadoOrden, string> = {
  pendiente: "Pendiente", en_ejecucion: "En ejecución", finalizado: "Finalizado",
};

export interface Cliente { id: string; nombre: string; correo: string; telefono: string }
export interface Zona {
  id: string; clienteId: string; nombre: string; direccion: string;
  areaM2: number; tipoVegetacion: TipoVegetacion; proximoServicio: string | null;
}

export interface LineaCotizacion {
  id: string; concepto: string; unidad: string; cantidad: number; valorUnitario: number;
}
export type TipoCosto = "mano_obra" | "maquinaria" | "herramientas" | "combustible" | "transporte" | "otro";
export const TIPOS_COSTO: Record<TipoCosto, string> = {
  mano_obra: "Mano de obra", maquinaria: "Maquinaria", herramientas: "Herramientas",
  combustible: "Combustible", transporte: "Transporte", otro: "Otro",
};
export interface CostoInterno {
  id: string; tipo: TipoCosto; concepto: string; cantidad: number; valorUnitario: number;
}
export interface HitoPago { id: string; descripcion: string; porcentaje: number }

export interface Cotizacion {
  id: string; clienteId: string; zonaId: string; zonaNombre: string;
  objeto: string; servicio: string; observaciones?: string;
  lineas: LineaCotizacion[]; costos: CostoInterno[]; hitos: HitoPago[];
  fechaVisita: string | null;
  estado: EstadoCotizacion; precio: number | null;
  fechaSolicitud: string; fechaEnvio: string | null; vigenciaDias: number;
  origen: "cliente" | "administrador";
}

export interface Operario {id:string;nombre:string;cuadrillaId:string;esLider:boolean;activo:boolean}
export interface Cuadrilla {
  id: string; nombre: string; encargado: string; integrantes: number; disponibleHoy: boolean;
}
export interface OrdenTrabajo {
  id: string; cotizacionId: string | null; clienteId: string; zonaId: string;
  zonaNombre: string; direccion: string; tipoServicio: string; fecha: string;
  horaInicio: string; horaFin: string; cuadrillaId: string | null; estado: EstadoOrden;
  finalizacion?: { fecha: string; hora: string; responsable: string; nota?: string };
}

/** Estructura histórica de precio por área. Conservar solo para migraciones; no se usa para cotizar. */
export interface DesglosePrecio {areaPorTarifa:number;factorVegetacion:number;factorFrecuencia:number;subtotalArea:number;costoPersonal:number;costoEquipos:number;total:number}
