export type Rol = "cliente" | "administrador" | "operario";

export type TipoVegetacion =
  | "cesped_simple"
  | "jardin_ornamental"
  | "zona_arborizada"
  | "mixta";

export const TIPOS_VEGETACION: Record<TipoVegetacion, string> = {
  cesped_simple: "Césped simple",
  jardin_ornamental: "Jardín ornamental",
  zona_arborizada: "Zona arborizada",
  mixta: "Mixta",
};

export type Frecuencia = "unica" | "mensual" | "quincenal" | "semanal";

export const FRECUENCIAS: Record<Frecuencia, string> = {
  unica: "Única vez",
  mensual: "Mensual",
  quincenal: "Quincenal",
  semanal: "Semanal",
};

export type Equipo = "guadañadora" | "motosierra" | "fumigadora";

export const EQUIPOS: Record<Equipo, string> = {
  guadañadora: "Guadañadora",
  motosierra: "Motosierra",
  fumigadora: "Fumigadora",
};

export type EstadoCotizacion = "pendiente" | "enviada" | "aceptada" | "rechazada";

export const ESTADOS_COTIZACION: Record<EstadoCotizacion, string> = {
  pendiente: "Pendiente",
  enviada: "Enviada",
  aceptada: "Aceptada",
  rechazada: "Rechazada",
};

export type EstadoOrden = "pendiente" | "en_ejecucion" | "finalizado" | "incidencia";

export const ESTADOS_ORDEN: Record<EstadoOrden, string> = {
  pendiente: "Pendiente",
  en_ejecucion: "En ejecución",
  finalizado: "Finalizado",
  incidencia: "Incidencia",
};

export interface Cliente {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
}

export interface Zona {
  id: string;
  clienteId: string;
  nombre: string;
  direccion: string;
  areaM2: number;
  tipoVegetacion: TipoVegetacion;
  proximoServicio: string | null;
}

export interface DesglosePrecio {
  areaPorTarifa: number;
  factorVegetacion: number;
  factorFrecuencia: number;
  subtotalArea: number;
  costoPersonal: number;
  costoEquipos: number;
  total: number;
}

export interface Cotizacion {
  id: string;
  clienteId: string;
  zonaId: string;
  zonaNombre: string;
  areaM2: number;
  tipoVegetacion: TipoVegetacion;
  frecuencia: Frecuencia;
  numeroOperarios: number;
  equipos: Equipo[];
  observaciones?: string;
  estado: EstadoCotizacion;
  precio: number | null;
  desglose: DesglosePrecio | null;
  fechaSolicitud: string;
  origen: "cliente" | "administrador";
}

export interface Cuadrilla {
  id: string;
  nombre: string;
  encargado: string;
  integrantes: number;
  disponibleHoy: boolean;
}

export interface OrdenTrabajo {
  id: string;
  cotizacionId: string | null;
  clienteId: string;
  zonaId: string;
  zonaNombre: string;
  direccion: string;
  tipoServicio: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  cuadrillaId: string | null;
  estado: EstadoOrden;
  finalizacion?: {
    fecha: string;
    hora: string;
    responsable: string;
    nota?: string;
  };
}
