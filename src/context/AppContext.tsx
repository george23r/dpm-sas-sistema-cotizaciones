import * as React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Cotizacion, DesglosePrecio, EstadoOrden, OrdenTrabajo, Rol } from "@/types";
import { ApiError } from "@/api/http";
import { cerrarSesionApi, iniciarSesionApi, obtenerUsuarioActual, type UsuarioActual } from "@/api/auth";
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
  rol: Rol | null;
  setRol: (rol: Rol) => void;
  usuarioActual: UsuarioActual | null;
  autenticado: boolean;
  authCargando: boolean;
  authError: string | null;
  iniciarSesion: (correo: string, clave: string) => Promise<{ ok: true; rol: Rol } | { ok: false; error: string }>;
  cerrarSesion: () => Promise<void>;
  modoDemo: boolean;
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
  const modoDemo = import.meta.env.VITE_DEMO_MODE === "true";
  const [usuarioActual, setUsuarioActual] = useState<UsuarioActual | null>(
    modoDemo ? { id: "demo-user", nombre: "Usuario demo", correo: "demo@dpm.local", rol: "cliente" } : null,
  );
  const [autenticado, setAutenticado] = useState(modoDemo);
  const [authCargando, setAuthCargando] = useState(!modoDemo);
  const [authError, setAuthError] = useState<string | null>(null);
  const [mostrarHU, setMostrarHU] = useState(true);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(cotizacionesSeed);
  const [ordenes, setOrdenes] = useState<OrdenTrabajo[]>(ordenesSeed);
  const setRol = (nuevoRol: Rol) => {
    if (!modoDemo) return;
    setUsuarioActual((actual) => actual ? { ...actual, rol: nuevoRol } : actual);
  };

  useEffect(() => {
    if (modoDemo) return;
    let activo = true;
    obtenerUsuarioActual()
      .then((usuario) => {
        if (!activo) return;
        setUsuarioActual(usuario ?? null);
        setAutenticado(Boolean(usuario));
      })
      .catch((error: unknown) => {
        if (!activo) return;
        if (error instanceof ApiError && error.status !== 401) {
          setAuthError(error.message);
        }
        setAutenticado(false);
      })
      .finally(() => {
        if (activo) setAuthCargando(false);
      });
    return () => {
      activo = false;
    };
  }, [modoDemo]);

  const iniciarSesion = async (correo: string, clave: string) => {
    if (modoDemo) {
      setAuthError(null);
      setAutenticado(true);
      return { ok: true as const, rol: "cliente" as const };
    }
    setAuthCargando(true);
    setAuthError(null);
    try {
      const usuario = await iniciarSesionApi(correo, clave);
      if (!usuario) throw new Error("La API no devolvió el usuario autenticado.");
      setUsuarioActual(usuario);
      setAutenticado(true);
      return { ok: true as const, rol: usuario.rol };
    } catch (error: unknown) {
      const message = error instanceof ApiError && error.status === 401
        ? "Correo o contraseña incorrectos."
        : error instanceof Error
          ? error.message
          : "No fue posible iniciar sesión.";
      setAuthError(message);
      setAutenticado(false);
      return { ok: false as const, error: message };
    } finally {
      setAuthCargando(false);
    }
  };

  const cerrarSesion = async () => {
    if (!modoDemo) {
      try {
        await cerrarSesionApi();
      } catch {
        // La sesión local se limpia incluso si el servidor no responde.
      }
    }
    setUsuarioActual(null);
    setAutenticado(false);
    setAuthError(null);
  };

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
      rol: usuarioActual?.rol ?? null,
      setRol,
      usuarioActual,
      autenticado,
      authCargando,
      authError,
      iniciarSesion,
      cerrarSesion,
      modoDemo,
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
    [usuarioActual, autenticado, authCargando, authError, modoDemo, mostrarHU, cotizaciones, ordenes],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp debe usarse dentro de AppProvider");
  return ctx;
}
