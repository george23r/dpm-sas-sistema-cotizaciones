import type { Zona } from "@/types";

export const zonas: Zona[] = [
  {
    id: "zon-01",
    clienteId: "cli-01",
    nombre: "Zona común - Torre A",
    direccion: "Calle 45 # 12-30, Cali",
    areaM2: 850,
    tipoVegetacion: "cesped_simple",
    proximoServicio: "2026-10-24",
  },
  {
    id: "zon-02",
    clienteId: "cli-01",
    nombre: "Jardines de ingreso",
    direccion: "Calle 45 # 12-30, Cali",
    areaM2: 220,
    tipoVegetacion: "jardin_ornamental",
    proximoServicio: "2026-10-20",
  },
  {
    id: "zon-03",
    clienteId: "cli-02",
    nombre: "Parque interno",
    direccion: "Avenida 6N # 28-15, Cali",
    areaM2: 1600,
    tipoVegetacion: "zona_arborizada",
    proximoServicio: "2026-11-02",
  },
  {
    id: "zon-04",
    clienteId: "cli-03",
    nombre: "Zonas verdes perimetrales",
    direccion: "Carrera 100 # 16-200, Cali",
    areaM2: 3200,
    tipoVegetacion: "mixta",
    proximoServicio: "2026-10-21",
  },
  {
    id: "zon-05",
    clienteId: "cli-04",
    nombre: "Canchas y zonas verdes",
    direccion: "Calle 70 # 5-18, Cali",
    areaM2: 1900,
    tipoVegetacion: "cesped_simple",
    proximoServicio: null,
  },
];
