import type { Cliente } from "@/types";

export const clientes: Cliente[] = [
  {
    id: "cli-01",
    nombre: "Conjunto Residencial Los Almendros",
    correo: "administracion@losalmendros.co",
    telefono: "300 456 7890",
  },
  {
    id: "cli-02",
    nombre: "Unidad Residencial Portal del Bosque",
    correo: "contacto@portaldelbosque.co",
    telefono: "301 222 3344",
  },
  {
    id: "cli-03",
    nombre: "Centro Comercial Plaza Mirador",
    correo: "mantenimiento@plazamirador.co",
    telefono: "312 789 1122",
  },
  {
    id: "cli-04",
    nombre: "Colegio Nuevo Horizonte",
    correo: "planta@nuevohorizonte.edu.co",
    telefono: "320 998 1122",
  },
];

export const CLIENTE_DEMO_ID = "cli-01";
