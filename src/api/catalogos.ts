import { apiFetch } from "./http";

export interface ClienteApi { id: number; nombre: string; correo_contacto: string | null; telefono: string | null }
export interface ZonaApi { id: number; cliente_id: number; nombre: string; direccion: string | null; area_m2: string | null; descripcion: string | null }
export interface ServicioApi { id: number; nombre: string; unidad_cobro: string; activo: boolean }

export const obtenerClientesApi = () => apiFetch<{ data: ClienteApi[] }>("/api/v1/clientes");
export const obtenerZonasApi = (clienteId?: number) => apiFetch<{ data: ZonaApi[] }>(clienteId ? `/api/v1/zonas?clienteId=${clienteId}` : "/api/v1/zonas");
export const obtenerServiciosApi = () => apiFetch<{ data: ServicioApi[] }>("/api/v1/servicios");
