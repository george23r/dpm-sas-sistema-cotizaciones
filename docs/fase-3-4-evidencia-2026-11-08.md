# Evidencia tÃ©cnica â€” Fases 3 y 4

> Este documento conserva el corte histÃ³rico inicial. Las comprobaciones posteriores y sus resultados vigentes estÃ¡n en `docs/fase-3-4-evidencia-actualizacion-2026-11-08.md`.

Fecha: 2026-11-08, America/Bogota.

## Backend implementado

- HU-03/HU-04/HU-05/HU-06/HU-07: `/api/v1/ordenes`, acciones de inicio/finalizaciÃ³n, asignaciÃ³n de cuadrillas y `/api/v1/cuadrillas`.
- HU-09/HU-10: `/api/v1/planillas`, registros, comparaciÃ³n y conciliaciÃ³n mediante `fn_comparar_planillas` y `sp_conciliar_planillas`.
- HU-08: `/api/v1/reportes/periodo` mediante `fn_reporte_periodo`.
- El pool fija `search_path=dpm,public`; no se aÃ±adieron tablas ni se ejecutÃ³ `DROP SCHEMA` sobre la base persistida.

## Frontend actualizado

- Centro de operaciones: filtros de cliente/periodo, seis mÃ©tricas de conteo, grÃ¡fico temporal basado en registros, prÃ³ximos mantenimientos, disponibilidad registrada de cuadrillas, alertas de cruces visibles, actividad reciente y accesos rÃ¡pidos.
- Reportes: filtros, KPIs, tabla por cliente y estados de API/demo explÃ­citos. No se muestra exportaciÃ³n porque aÃºn no existe endpoint verificado.
- Cuadrillas: fichas de capacidad, integrantes registrados, servicios prÃ³ximos y asignaciÃ³n de Ã³rdenes con mensaje de validaciÃ³n del servidor.
- `src/api/operaciones.ts` centraliza DTOs y llamadas de Ã³rdenes, cuadrillas, planillas y reportes.

## Prueba HTTP contra PostgreSQL 16 temporal

Base: `dpm_codex_test_20261108`. Cuenta y datos de prueba fueron ficticios y solo existieron en esa base.

```text
POST /api/v1/auth/login                         200
GET  /api/v1/cuadrillas                         200
POST /api/v1/ordenes                             201
POST /api/v1/planillas (campo)                   201
POST /api/v1/planillas (administrativa)          201
POST /api/v1/planillas/:id/registros             201
GET  /api/v1/planillas/comparar                  200, resultado coincide
POST /api/v1/planillas/conciliar                 200, estado conciliada
GET  /api/v1/reportes/periodo                    200
```

La base temporal ya contenÃ­a las comprobaciones SQL de la fase anterior; la prueba agregÃ³ Ãºnicamente registros ficticios de integraciÃ³n.

## Verificaciones de cÃ³digo

- `npm run build`: PASS.
- `npm run test:unit`: 15 PASS.
- `npm run lint`: PASS con advertencias React no bloqueantes.
- `npm run build --prefix backend`: PASS.
- `npm test --prefix backend`: 4 PASS.
- `npm run lint --prefix backend`: PASS.

## Brechas y lÃ­mites

- `Programacion.tsx`, `Jornadas.tsx` y los portales de cliente/operario aÃºn contienen flujos de UI en memoria; la API ya existe, pero sus mutaciones frontend no estÃ¡n completamente migradas.
- La ediciÃ³n de integrantes, liderazgo y desactivaciÃ³n de cuadrillas no se habilitÃ³ porque no existe todavÃ­a un contrato CRUD validado para esas operaciones.
- El reporte no inventa tendencias, ingresos ni porcentajes; solo muestra la funciÃ³n SQL y datos disponibles.
- No se agregÃ³ facturaciÃ³n, nÃ³mina, recargos monetarios, notificaciones, geolocalizaciÃ³n ni exportaciÃ³n no soportada.
- No se ejecutaron todavÃ­a Playwright, capturas de navegador ni JMeter; por tanto no se declara evidencia visual cross-browser ni rendimiento RNF-03.

