# Auditoría Fase 0 — estado real del repositorio

**Fecha de auditoría:** 2026-11-08 (America/Bogota)  
**Repositorio remoto:** `https://github.com/george23r/dpm-sas-sistema-cotizaciones`  
**Commit remoto observado:** `72e2135 Agregar prototipo visual navegable del sistema DPM SAS`  
**Alcance:** inspección del árbol local existente, sin modificar datos empresariales ni sustituir la aplicación.

## Evidencia de la línea base

| Comprobación | Resultado | Evidencia |
|---|---|---|
| Dependencias reproducibles | OK | `npm ci` terminó con código 0; 86 paquetes auditados, 0 vulnerabilidades reportadas. |
| Compilación | OK | `npm run build` terminó con código 0; Vite generó `dist/`. |
| Pruebas unitarias | PARCIAL | Se agregó `npm run test:unit` con pruebas de utilidades frontend; aún faltan pruebas de integración de API/BD. |
| Lint | OK CON ADVERTENCIAS | `npm run lint` termina con código 0; 5 advertencias de Fast Refresh/dependencias de hooks. |
| Backend/persistencia | NO PRESENTE | No existen `src/api`, servidor Express, migraciones, esquema PostgreSQL ni endpoints implementados. |
| Estado de trabajo local | PREEXISTENTE | `git status` ya mostraba cambios locales en 56 archivos antes de esta auditoría; se preservan y no se revierten. |

## Diferencias entre el alcance solicitado y el código observado

| Área | Solicitado / criterio objetivo | Estado observado | Fase propuesta | Bloqueo o riesgo |
|---|---|---|---|---|
| Acceso | `POST /auth/login`, `GET /auth/me`, cierre/expiración de sesión y rol real | `Login.tsx` acepta cualquier correo y clave no vacíos; `AppContext` mantiene `autenticado` y `rol` en memoria | Fase 1 | No existe contrato ni servidor de autenticación. |
| Autorización | Servidor decide permisos por administrador, cliente y operario | `RutaDeRol` solo compara estado React; `TopBar` permite cambiar el rol | Fase 1 | La protección actual es UX, no seguridad. |
| Cliente HTTP | Cliente tipado, `VITE_API_URL`, estados de carga/error y adaptación DTO/UI | No existe `src/api` ni configuración de API | Fase 1 | Se puede preparar el cliente, pero el flujo E2E queda pendiente hasta disponer del backend. |
| Cotizaciones | Líneas editables, visita, alcance, condiciones, estados y costos internos solo para administrador | El modelo usa área, vegetación, frecuencia, equipos y `src/lib/precio.ts`; los datos viven en seeds | Fase 2 | No hay persistencia ni contrato de cotización. La fórmula de precio actual no debe trasladarse como regla obligatoria. |
| Programación | Orden desde cotización aceptada, agenda mes/semana/lista, filtros y solapes decididos por servidor | Hay vista propia de programación y validación de solape en `AppContext`; también permite crear órdenes sin demostrar aceptación | Fase 3 | Falta API; no debe presentarse como regla de servidor. |
| Cuadrillas | Alta/edición/desactivación y asignación con máximo un líder activo | Existe listado/asignación visual con seeds; no existen trabajadores persistentes ni endpoint de liderazgo | Fase 3 | Reglas empresariales y permisos deben confirmarse en backend. |
| Jornadas/conciliación | Campo/administración, turnos, diferencias, bloqueo de conciliación y auditoría | No existen `Jornadas.tsx`, `Reportes.tsx`, `Clientes.tsx` ni `Trabajadores.tsx` en el árbol actual | Fase 4 | La descripción académica no equivale a una pantalla implementada. |
| Catálogo | Pantalla `admin/servicios` y unidades pendientes de confirmación | No existe pantalla ni catálogo | Fase 4 | No crear tarifas ficticias ni una tabla adicional sin revisar el esquema real. |
| Registro de cliente | Feature flag desactivada | No existe pantalla de registro | Fase 4 | La autogestión sigue siendo hipótesis pendiente. |
| Cliente/operario | Recursos filtrados por identidad real; operación offline no simulada | El filtrado usa `CLIENTE_DEMO_ID` y `OPERARIO_DEMO_CUADRILLA_ID`; finalizar cambia estado local | Fase 2–4 | No cumple aislamiento ni persistencia de producción. |
| Reportes | Datos por API, filtros y exportación solo si existe | No existe página de reportes en el árbol actual | Fase 4 | No inferir que hay una funcionalidad productiva. |
| QA/evidencia | Unitarias, formularios, permisos, estados, e2e y capturas etiquetadas | No hay framework de pruebas configurado ni workflow `.github/workflows/` | Fase 5 | Deben definirse comandos y entorno cuando haya API desplegable. |

## Rutas actuales observadas

El enrutador actual contiene `/login`, cuatro rutas de cliente, cinco rutas de administrador (panel, cotizaciones, nueva cotización, programación y cuadrillas) y dos rutas de operario (órdenes y detalle). La aplicación no contiene actualmente las rutas de jornadas, reportes, clientes, trabajadores, catálogo ni conciliación que se describen como objetivo.

## Modelo actual y fuente de verdad

- `src/context/AppContext.tsx` concentra autenticación demo, rol, cotizaciones y órdenes.
- `src/data/*.ts` contiene clientes, zonas, cuadrillas, cotizaciones y órdenes seed.
- `src/types/index.ts` incluye `EstadoOrden = incidencia`, aunque el alcance solicitado indica no crear visualmente ese estado si no existe en el modelo aprobado.
- `src/lib/precio.ts` implementa una fórmula basada en área/tarifa/factores; se conserva como prototipo auditado, pero no se debe convertir en regla obligatoria de producción.
- No hay almacenamiento persistente; recargar la página pierde las mutaciones hechas en memoria.

## Contratos de API que deben existir antes de marcar integración

Estos son contratos de trabajo derivados del alcance solicitado, no endpoints actualmente disponibles:

| Módulo | Endpoints mínimos por validar con backend |
|---|---|
| Auth | `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Cotizaciones | solicitudes/cotizaciones por rol, detalle, líneas, envío, aceptación/rechazo |
| Clientes y zonas | listado y CRUD administrativo, consulta aislada por cliente |
| Órdenes/agenda | creación desde cotización aceptada, listado/filtros, asignación, inicio/finalización |
| Cuadrillas/trabajadores | CRUD y asignaciones, validación de líder activo |
| Jornadas | planillas de campo/administrativas, comparación, conciliación y auditoría |
| Reportes/catálogo | consultas filtradas y catálogo de servicios, solo después de confirmar esquema |

Hasta que el backend exponga y valide estos contratos, cualquier pantalla integrada debe mostrar estado de conexión/error y no afirmar persistencia ni autorización real.

## Decisión de cierre de Fase 0

Fase 0 queda **auditada**. El prototipo existente compila, pero la integración real está bloqueada por la ausencia del backend y de pruebas configuradas. La preparación de Fase 1 está documentada en `docs/fase-1-evidencia.md`; no se marca como Done porque aún no existe un flujo punta a punta contra API y PostgreSQL.
