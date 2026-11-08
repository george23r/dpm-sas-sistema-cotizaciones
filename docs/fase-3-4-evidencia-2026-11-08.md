# Evidencia técnica — Fases 3 y 4

Fecha: 2026-11-08, America/Bogota.

## Backend implementado

- HU-03/HU-04/HU-05/HU-06/HU-07: `/api/v1/ordenes`, acciones de inicio/finalización, asignación de cuadrillas y `/api/v1/cuadrillas`.
- HU-09/HU-10: `/api/v1/planillas`, registros, comparación y conciliación mediante `fn_comparar_planillas` y `sp_conciliar_planillas`.
- HU-08: `/api/v1/reportes/periodo` mediante `fn_reporte_periodo`.
- El pool fija `search_path=dpm,public`; no se añadieron tablas ni se ejecutó `DROP SCHEMA` sobre la base persistida.

## Frontend actualizado

- Centro de operaciones: filtros de cliente/periodo, seis métricas de conteo, gráfico temporal basado en registros, próximos mantenimientos, disponibilidad registrada de cuadrillas, alertas de cruces visibles, actividad reciente y accesos rápidos.
- Reportes: filtros, KPIs, tabla por cliente y estados de API/demo explícitos. No se muestra exportación porque aún no existe endpoint verificado.
- Cuadrillas: fichas de capacidad, integrantes registrados, servicios próximos y asignación de órdenes con mensaje de validación del servidor.
- `src/api/operaciones.ts` centraliza DTOs y llamadas de órdenes, cuadrillas, planillas y reportes.

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

La base temporal ya contenía las comprobaciones SQL de la fase anterior; la prueba agregó únicamente registros ficticios de integración.

## Verificaciones de código

- `npm run build`: PASS.
- `npm run test:unit`: 15 PASS.
- `npm run lint`: PASS con advertencias React no bloqueantes.
- `npm run build --prefix backend`: PASS.
- `npm test --prefix backend`: 4 PASS.
- `npm run lint --prefix backend`: PASS.

## Brechas y límites

- `Programacion.tsx`, `Jornadas.tsx` y los portales de cliente/operario aún contienen flujos de UI en memoria; la API ya existe, pero sus mutaciones frontend no están completamente migradas.
- La edición de integrantes, liderazgo y desactivación de cuadrillas no se habilitó porque no existe todavía un contrato CRUD validado para esas operaciones.
- El reporte no inventa tendencias, ingresos ni porcentajes; solo muestra la función SQL y datos disponibles.
- No se agregó facturación, nómina, recargos monetarios, notificaciones, geolocalización ni exportación no soportada.
- No se ejecutaron todavía Playwright, capturas de navegador ni JMeter; por tanto no se declara evidencia visual cross-browser ni rendimiento RNF-03.
