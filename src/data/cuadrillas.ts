import type { Cuadrilla } from "@/types";

export const cuadrillas: Cuadrilla[] = [
  {
    id: "cua-01",
    nombre: "Cuadrilla Esmeralda",
    encargado: "Luis Fernando Gómez",
    integrantes: 4,
    disponibleHoy: true,
  },
  {
    id: "cua-02",
    nombre: "Cuadrilla Follaje",
    encargado: "Sandra Milena Rojas",
    integrantes: 3,
    disponibleHoy: true,
  },
  {
    id: "cua-03",
    nombre: "Cuadrilla Raíces",
    encargado: "Camilo Andrés Torres",
    integrantes: 5,
    disponibleHoy: false,
  },
];

export const OPERARIO_DEMO_CUADRILLA_ID = "cua-01";
export const OPERARIO_DEMO_NOMBRE = "Luis Fernando Gómez";
