import { apiFetch } from "./http";

export interface ClienteApi { id: number; nombre: string; nit?: string | null; tipo?: "residencial" | "comercial" | "institucional" | "agricola"; correo_contacto: string | null; telefono: string | null }
export interface ZonaApi { id: number; cliente_id: number; nombre: string; direccion: string | null; area_m2: string | null; descripcion: string | null }
export interface ServicioApi { id: number; nombre: string; unidad_cobro: string; activo: boolean }
export interface OperarioApi { id: number; nombre: string; cuadrilla_id: number; cuadrilla: string; es_lider: boolean; activo: boolean; servicios_proximos: number }

export const obtenerClientesApi = () => apiFetch<{ data: ClienteApi[] }>("/api/v1/clientes");
export const crearClienteApi = (input: { nombre: string; nit?: string; tipo: "residencial" | "comercial" | "institucional" | "agricola"; telefono?: string; correoContacto?: string }) => apiFetch<{ data: ClienteApi }>("/api/v1/clientes", { method: "POST", body: JSON.stringify(input) });
export const actualizarClienteApi = (id: number, input: Partial<{ nombre: string; nit: string; tipo: "residencial" | "comercial" | "institucional" | "agricola"; telefono: string; correoContacto: string }>) => apiFetch<{ data: ClienteApi }>(`/api/v1/clientes/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const obtenerZonasApi = (clienteId?: number) => apiFetch<{ data: ZonaApi[] }>(clienteId ? `/api/v1/zonas?clienteId=${clienteId}` : "/api/v1/zonas");
export const crearZonaApi = (input: { clienteId: number; nombre: string; direccion?: string; areaM2?: number; descripcion?: string }) => apiFetch<{ data: ZonaApi }>("/api/v1/zonas", { method: "POST", body: JSON.stringify(input) });
export const actualizarZonaApi = (id: number, input: Partial<{ nombre: string; direccion: string; areaM2: number; descripcion: string }>) => apiFetch<{ data: ZonaApi }>(`/api/v1/zonas/${id}`, { method: "PATCH", body: JSON.stringify(input) });
export const obtenerServiciosApi = () => apiFetch<{ data: ServicioApi[] }>("/api/v1/servicios");
export const obtenerOperariosApi = () => apiFetch<{ data: OperarioApi[] }>("/api/v1/operarios");
