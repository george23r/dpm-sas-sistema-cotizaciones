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

export function obtenerCotizacionesApi(params: { estado?: EstadoCotizacion; clienteId?: number } = {}) {
  const query = new URLSearchParams();
  if (params.estado) query.set("estado", params.estado);
  if (params.clienteId) query.set("clienteId", String(params.clienteId));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return apiFetch<{ data: CotizacionApi[] }>(`/api/v1/cotizaciones${suffix}`);
}

export function obtenerCotizacionApi(id: number) {
  return apiFetch<{ data: CotizacionApi }>(`/api/v1/cotizaciones/${id}`);
}
