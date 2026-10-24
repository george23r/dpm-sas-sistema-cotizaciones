import { Navigate, Route, Routes } from "react-router-dom";
import { AppProvider, useApp } from "@/context/AppContext";
import { AppShell } from "@/components/layout/AppShell";
import { RutaProtegida, RutaDeRol } from "@/components/shared/RutaProtegida";
import { RUTA_INICIAL_POR_ROL } from "@/components/layout/nav";
import { Login } from "@/pages/Login";
import { MisZonas } from "@/pages/cliente/MisZonas";
import { SolicitarCotizacion } from "@/pages/cliente/SolicitarCotizacion";
import { MisCotizaciones } from "@/pages/cliente/MisCotizaciones";
import { Historial } from "@/pages/cliente/Historial";
import { Panel } from "@/pages/admin/Panel";
import { Cotizaciones } from "@/pages/admin/Cotizaciones";
import { NuevaCotizacion } from "@/pages/admin/NuevaCotizacion";
import { Programacion } from "@/pages/admin/Programacion";
import { Cuadrillas } from "@/pages/admin/Cuadrillas";
import { Jornadas } from "@/pages/admin/Jornadas";
import { Reportes } from "@/pages/admin/Reportes";
import { MisOrdenes } from "@/pages/operario/MisOrdenes";
import { DetalleOrden } from "@/pages/operario/DetalleOrden";

function IndiceApp() {
  const { rol } = useApp();
  return <Navigate to={RUTA_INICIAL_POR_ROL[rol]} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />

      <Route
        path="/app"
        element={
          <RutaProtegida>
            <AppShell />
          </RutaProtegida>
        }
      >
        <Route index element={<IndiceApp />} />

        <Route
          path="cliente/zonas"
          element={
            <RutaDeRol rolRequerido="cliente">
              <MisZonas />
            </RutaDeRol>
          }
        />
        <Route
          path="cliente/cotizaciones/nueva"
          element={
            <RutaDeRol rolRequerido="cliente">
              <SolicitarCotizacion />
            </RutaDeRol>
          }
        />
        <Route
          path="cliente/cotizaciones"
          element={
            <RutaDeRol rolRequerido="cliente">
              <MisCotizaciones />
            </RutaDeRol>
          }
        />
        <Route
          path="cliente/historial"
          element={
            <RutaDeRol rolRequerido="cliente">
              <Historial />
            </RutaDeRol>
          }
        />

        <Route
          path="admin/panel"
          element={
            <RutaDeRol rolRequerido="administrador">
              <Panel />
            </RutaDeRol>
          }
        />
        <Route
          path="admin/cotizaciones"
          element={
            <RutaDeRol rolRequerido="administrador">
              <Cotizaciones />
            </RutaDeRol>
          }
        />
        <Route
          path="admin/cotizaciones/nueva"
          element={
            <RutaDeRol rolRequerido="administrador">
              <NuevaCotizacion />
            </RutaDeRol>
          }
        />
        <Route path="admin/cotizaciones/editar/:cotizacionId" element={<RutaDeRol rolRequerido="administrador"><NuevaCotizacion /></RutaDeRol>} />
        <Route
          path="admin/programacion"
          element={
            <RutaDeRol rolRequerido="administrador">
              <Programacion />
            </RutaDeRol>
          }
        />
        <Route path="admin/reportes" element={<RutaDeRol rolRequerido="administrador"><Reportes /></RutaDeRol>} />
        <Route path="admin/jornadas" element={<RutaDeRol rolRequerido="administrador"><Jornadas /></RutaDeRol>} />
        <Route
          path="admin/cuadrillas"
          element={
            <RutaDeRol rolRequerido="administrador">
              <Cuadrillas />
            </RutaDeRol>
          }
        />

        <Route
          path="operario/ordenes"
          element={
            <RutaDeRol rolRequerido="operario">
              <MisOrdenes />
            </RutaDeRol>
          }
        />
        <Route
          path="operario/ordenes/:id"
          element={
            <RutaDeRol rolRequerido="operario">
              <DetalleOrden />
            </RutaDeRol>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
