import * as React from "react";
import { createContext, useContext, useMemo, useState } from "react";
import type { Cotizacion, DesglosePrecio, EstadoOrden, OrdenTrabajo, Rol } from "@/types";
import { clientes, CLIENTE_DEMO_ID } from "@/data/clientes";
import { zonas } from "@/data/zonas";
import { cuadrillas, OPERARIO_DEMO_CUADRILLA_ID, OPERARIO_DEMO_NOMBRE } from "@/data/cuadrillas";
import { cotizacionesSeed } from "@/data/cotizaciones";
import { ordenesSeed } from "@/data/ordenes";

interface NuevaCotizacionInput {
  clienteId: string;
  zonaId: string;
  zonaNombre: string;
  areaM2: number;
  tipoVegetacion: Cotizacion["tipoVegetacion"];
  frecuencia: Cotizacion["frecuencia"];
  numeroOperarios: number;
  equipos: Cotizacion["equipos"];
  observaciones?: string;
  origen: Cotizacion["origen"];
  estado?: Cotizacion["estado"];
  precio?: number | null;
  desglose?: DesglosePrecio | null;
}

interface ProgramarOrdenInput {
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
}

interface FinalizarOrdenInput {
  nota?: string;
}

interface AppContextValue {
  rol: Rol;
  setRol: (rol: Rol) => void;
  autenticado: boolean;
  iniciarSesion: () => void;
  cerrarSesion: () => void;
  mostrarHU: boolean;
  alternarHU: () => void;

  clientes: typeof clientes;
  zonas: typeof zonas;
  cuadrillas: typeof cuadrillas;
  clienteActualId: string;
  cuadrillaActualId: string;
  operarioActualNombre: string;

  cotizaciones: Cotizacion[];
  crearCotizacion: (input: NuevaCotizacionInput) => Cotizacion;
  actualizarEstadoCotizacion: (
    id: string,
    estado: Cotizacion["estado"],
    precio?: number | null,
    desglose?: DesglosePrecio | null,
  ) => void;

  ordenes: OrdenTrabajo[];
  crearOrden: (input: ProgramarOrdenInput) => { ok: true; orden: OrdenTrabajo } | { ok: false; error: string };
  asignarCuadrillaAOrden: (
    ordenId: string,
    cuadrillaId: string,
  ) => { ok: true } | { ok: false; error: string };
  cambiarEstadoOrden: (ordenId: string, estado: EstadoOrden) => void;
  finalizarOrden: (ordenId: string, input: FinalizarOrdenInput) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

let contador = 100;
function nuevoId(prefijo: string) {
  contador += 1;
  return `${prefijo}-${contador}`;
}

function haySolape(aInicio: string, aFin: string, bInicio: string, bFin: string) {
  return aInicio < bFin && bInicio < aFin;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [rol, setRol] = useState<Rol>("cliente");
  const [autenticado, setAutenticado] = useState(false);
  const [mostrarHU, setMostrarHU] = useState(true);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(cotizacionesSeed);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>(ordenesSeed);

  const crearCotizacion = (input: NuevaCotizacionInput): Cotizacion => {
    const nueva: Cotizacion = {
      id: nuevoId("cot"),
      clienteId: input.clienteId,
      zonaId: input.zonaId,
      zonaNombre: input.zonaNombre,
      areaM2: input.areaM2,
      tipoVegetacion: input.tipoVegetacion,
      frecuencia: input.frecuencia,
      numeroOperarios: input.numeroOperarios,
      equipos: input.equipos,
      observaciones: input.observaciones,
      estado: input.estado ?? "pendiente",
      precio: input.precio ?? null,
      desglose: input.desglose ?? null,
      fechaSolicitud: new Date().toISOString().slice(0, 10),
      origen: input.origen,
    };
    setCotizaciones((prev) => [nueva, ...prev]);
    return nueva;
  };

  const actualizarEstadoCotizacion: AppContextValue["actualizarEstadoCotizacion"] = (
    id,
    estado,
    precio,
    desglose,
  ) => {
    setCotizaciones((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              estado,
              precio: precio !== undefined ? precio : c.precio,
              desglose: desglose !== undefined ? desglose : c.desglose,
            }
          : c,
      ),
    );
  };

  const crearOrden: AppContextValue["crearOrden"] = (input) => {
    if (input.cuadrillaId) {
      const conflicto = ordenes.find(
        (o) =>
          o.cuadrillaId === input.cuadrillaId &&
          o.fecha === input.fecha &&
          o.estado !== "finalizado" &&
          haySolape(o.horaInicio, o.horaFin, input.horaInicio, input.horaFin),
      );
      if (conflicto) {
        return {
          ok: false,
          error: "La cuadrilla ya tiene un servicio asignado en este horario.",
        };
      }
    }

    const nueva: OrdenTrabajo = {
      id: nuevoId("ord"),
      cotizacionId: input.cotizacionId,
      clienteId: input.clienteId,
      zonaId: input.zonaId,
      zonaNombre: input.zonaNombre,
      direccion: input.direccion,
      tipoServicio: input.tipoServicio,
      fecha: input.fecha,
      horaInicio: input.horaInicio,
      horaFin: input.horaFin,
      cuadrillaId: input.cuadrillaId,
      estado: "pendiente",
    };
    setOrdenes((prev) => [...prev, nueva]);
    return { ok: true, orden: nueva };
  };

  const asignarCuadrillaAOrden: AppContextValue["asignarCuadrillaAOrden"] = (ordenId, cuadrillaId) => {
    const orden = ordenes.find((o) => o.id === ordenId);
    if (!orden) return { ok: false, error: "Orden no encontrada." };

    const conflicto = ordenes.find(
      (o) =>
        o.id !== ordenId &&
        o.cuadrillaId === cuadrillaId &&
        o.fecha === orden.fecha &&
        o.estado !== "finalizado" &&
        haySolape(o.horaInicio, o.horaFin, orden.horaInicio, orden.horaFin),
    );
    if (conflicto) {
      return {
        ok: false,
        error: "La cuadrilla ya tiene un servicio asignado en este horario.",
      };
    }

    setOrdenes((prev) => prev.map((o) => (o.id === ordenId ? { ...o, cuadrillaId } : o)));
    return { ok: true };
  };

  const cambiarEstadoOrden: AppContextValue["cambiarEstadoOrden"] = (ordenId, estado) => {
    setOrdenes((prev) => prev.map((o) => (o.id === ordenId ? { ...o, estado } : o)));
  };

  const finalizarOrden: AppContextValue["finalizarOrden"] = (ordenId, input) => {
    const ahora = new Date();
    setOrdenes((prev) =>
      prev.map((o) =>
        o.id === ordenId
          ? {
              ...o,
              estado: "finalizado",
              finalizacion: {
                fecha: ahora.toISOString().slice(0, 10),
                hora: ahora.toTimeString().slice(0, 5),
                responsable: OPERARIO_DEMO_NOMBRE,
                nota: input.nota,
              },
            }
          : o,
      ),
    );
  };

  const value = useMemo<AppContextValue>(
    () => ({
      rol,
      setRol,
      autenticado,
      iniciarSesion: () => setAutenticado(true),
      cerrarSesion: () => setAutenticado(false),
      mostrarHU,
      alternarHU: () => setMostrarHU((v) => !v),

      clientes,
      zonas,
      cuadrillas,
      clienteActualId: CLIENTE_DEMO_ID,
      cuadrillaActualId: OPERARIO_DEMO_CUADRILLA_ID,
      operarioActualNombre: OPERARIO_DEMO_NOMBRE,

      cotizaciones,
      crearCotizacion,
      actualizarEstadoCotizacion,

      ordenes,
      crearOrden,
      asignarCuadrillaAOrden,
      cambiarEstadoOrden,
      finalizarOrden,
    }),
    [rol, autenticado, mostrarHU, cotizaciones, ordenes],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
