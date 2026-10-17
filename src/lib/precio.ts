import type { DesglosePrecio, Equipo, Frecuencia, TipoVegetacion } from "@/types";

export const TARIFA_BASE_M2 = 350;

export const FACTOR_VEGETACION: Record<TipoVegetacion, number> = {
  cesped_simple: 1,
  jardin_ornamental: 1.3,
  zona_arborizada: 1.6,
  mixta: 1.4,
};

export const FACTOR_FRECUENCIA: Record<Frecuencia, number> = {
  unica: 1,
  quincenal: 1,
  mensual: 0.9,
  semanal: 1.2,
};

export const COSTO_OPERARIO = 45000;

export const COSTO_EQUIPO: Record<Equipo, number> = {
  guadañadora: 20000,
  motosierra: 60000,
  fumigadora: 40000,
};

export interface CalculoPrecioInput {
  areaM2: number;
  tipoVegetacion: TipoVegetacion;
  frecuencia: Frecuencia;
  numeroOperarios: number;
  equipos: Equipo[];
}

export function calcularPrecio(input: CalculoPrecioInput): DesglosePrecio {
  const areaPorTarifa = input.areaM2 * TARIFA_BASE_M2;
  const factorVegetacion = FACTOR_VEGETACION[input.tipoVegetacion];
  const factorFrecuencia = FACTOR_FRECUENCIA[input.frecuencia];
  const subtotalArea = areaPorTarifa * factorVegetacion * factorFrecuencia;
  const costoPersonal = input.numeroOperarios * COSTO_OPERARIO;
  const costoEquipos = input.equipos.reduce((acc, eq) => acc + COSTO_EQUIPO[eq], 0);
  const total = Math.round(subtotalArea + costoPersonal + costoEquipos);

  return {
    areaPorTarifa,
    factorVegetacion,
    factorFrecuencia,
    subtotalArea: Math.round(subtotalArea),
    costoPersonal,
    costoEquipos,
    total,
  };
}
