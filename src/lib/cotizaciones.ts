import type { Cotizacion, CostoInterno, HitoPago, LineaCotizacion } from "@/types";

const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
export function totalLineas(lineas: LineaCotizacion[]): number {
  return redondear(lineas.reduce((t, l) => t + l.cantidad * l.valorUnitario, 0));
}
export function totalCostos(costos: CostoInterno[]): number {
  return redondear(costos.reduce((t, c) => t + c.cantidad * c.valorUnitario, 0));
}
export function sumaHitos(hitos: HitoPago[]): number {
  return redondear(hitos.reduce((t, h) => t + h.porcentaje, 0));
}
export function fechaVencimiento(c: Pick<Cotizacion, "fechaEnvio" | "vigenciaDias">): string | null {
  if (!c.fechaEnvio) return null;
  const d = new Date(c.fechaEnvio + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + c.vigenciaDias);
  return d.toISOString().slice(0, 10);
}
export function cotizacionVigente(c: Cotizacion, hoy: string = new Date().toLocaleDateString("en-CA", {timeZone:"America/Bogota"})): boolean {
  const vence = fechaVencimiento(c);
  return c.estado === "enviada" && !!vence && hoy <= vence;
}
export function validarEnvio(c: Pick<Cotizacion, "objeto"|"fechaVisita"|"lineas"|"hitos">): string | null {
  if (!c.objeto.trim()) return "Escribe el objeto de la cotización.";
  if (!c.fechaVisita) return "Registra la fecha de la visita técnica antes de enviar.";
  if (!c.lineas.length || c.lineas.some(l => !l.concepto.trim() || !l.unidad.trim() || !(l.cantidad > 0) || !(l.valorUnitario >= 0) || !Number.isFinite(l.cantidad) || !Number.isFinite(l.valorUnitario))) return "Agrega conceptos con cantidades positivas y valores válidos.";
  if (totalLineas(c.lineas) <= 0) return "La cotización debe tener un valor positivo.";
  if (!c.hitos.length || c.hitos.some(h=>!h.descripcion.trim() || !Number.isFinite(h.porcentaje) || h.porcentaje<=0)) return "Configura hitos de pago válidos.";
  if (Math.abs(sumaHitos(c.hitos)-100)>0.001) return "Los hitos de pago deben sumar exactamente 100 %.";
  return null;
}
export function consecutivoCotizacion(id: string): string {
  const num = Number(id.split("-").at(-1));
  return Number.isFinite(num) ? "COT-" + String(num).padStart(4,"0") : id.toUpperCase();
}
