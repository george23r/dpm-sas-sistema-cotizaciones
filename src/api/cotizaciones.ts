import { apiFetch } from "./http";
import type { EstadoCotizacion } from "@/types";

export interface CotizacionApi {
  id: number;
  consecutivo: string;
  cliente_id: number;
  zona_id: number;
  objeto: string;
  alcance: string | null;
  estado: EstadoCotizacion;
  total: string | null;
  vigencia_dias: number;
  solicitada_en: string;
  enviada_en: string | null;
  cliente: string;
  zona: string;
}

export interface CotizacionDetalleApi extends CotizacionApi {
  incluye: string | null;
  tiempo_ejecucion: string | null;
  observaciones: string | null;
  vence_el: string | null;
  lineas: Array<{ id: number; concepto: string; cantidad: string | number; valor_unitario: string | number; valor_total: string | number }>;
  visitas: Array<{ id: number; fecha: string; observaciones: string | null }>;
  hitos: Array<{ orden: number; descripcion: string; porcentaje: string | number }>;
  costos?: Array<{ id: number; tipo: string; descripcion: string; cantidad: string | number; valor_unitario: string | number; subtotal: string | number }>;
}

export interface PaginacionApi { page: number; pageSize: number; total: number; totalPages: number }

export function obtenerCotizacionesApi(params: { estado?: EstadoCotizacion; clienteId?: number; search?: string; desde?: string; hasta?: string; page?: number; pageSize?: number } = {}) {
  const query = new URLSearchParams();
  if (params.estado) query.set("estado", params.estado);
  if (params.clienteId) query.set("clienteId", String(params.clienteId));
  if (params.search) query.set("search", params.search);
  if (params.desde) query.set("desde", params.desde);
  if (params.hasta) query.set("hasta", params.hasta);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<{ data: CotizacionApi[]; meta: PaginacionApi }>(`/api/v1/cotizaciones${suffix}`);
}

export function obtenerCotizacionApi(id: number) {
  return apiFetch<{ data: CotizacionDetalleApi }>(`/api/v1/cotizaciones/${id}`);
}

export function crearCotizacionApi(input: {
  clienteId?: number;
  zonaId: number;
  objeto: string;
  alcance?: string;
  incluye?: string;
  tiempoEjecucion?: string;
  observaciones?: string;
  vigenciaDias?: number;
}) {
  return apiFetch<{ data: { id: number } }>("/api/v1/cotizaciones", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function agregarVisitaApi(id: number, input: { fecha: string; observaciones?: string }) {
  return apiFetch<{ data: { id: number } }>(`/api/v1/cotizaciones/${id}/visitas`, { method: "POST", body: JSON.stringify(input) });
}

export function agregarLineaApi(id: number, input: { concepto: string; cantidad: number; valorUnitario: number; servicioId?: number | null }) {
  return apiFetch<{ data: { id: number } }>(`/api/v1/cotizaciones/${id}/lineas`, { method: "POST", body: JSON.stringify(input) });
}

export function agregarCostoApi(id: number, input: { tipo: string; descripcion: string; cantidad: number; valorUnitario: number }) {
  return apiFetch<{ data: { id: number } }>(`/api/v1/cotizaciones/${id}/costos`, { method: "POST", body: JSON.stringify(input) });
}

export function agregarHitoApi(id: number, input: { orden: number; descripcion: string; porcentaje: number }) {
  return apiFetch<{ data: { id: number } }>(`/api/v1/cotizaciones/${id}/hitos`, { method: "POST", body: JSON.stringify(input) });
}

export function enviarCotizacionApi(id: number) {
  return apiFetch<{ data: { id: number; estado: string } }>(`/api/v1/cotizaciones/${id}/enviar`, { method: "POST" });
}

export function responderCotizacionApi(id: number, acepta: boolean) {
  return apiFetch<{ data: { id: number; estado: string } }>(`/api/v1/cotizaciones/${id}/respuesta`, { method: "POST", body: JSON.stringify({ acepta }) });
}

