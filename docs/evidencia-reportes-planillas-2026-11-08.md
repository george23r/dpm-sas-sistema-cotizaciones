# Evidencia HU-08 — reporte de conciliación de planillas

Fecha: 2026-11-08  
Alcance: fase 4, ampliación del reporte de periodo.

## Cambio verificado

`dpm.fn_reporte_periodo(date, date, integer)` ahora devuelve también:

- `planillas_conciliadas`: pares de planillas con estado `conciliada`.
- `diferencias_planillas`: pares en estado `en_comparacion`, que requieren revisión.

El frontend administrativo muestra ambos indicadores junto con cotizaciones, servicios y horas. Los filtros de periodo y cliente se conservan y los datos provienen de la API cuando el modo demo está desactivado.

## Migración

Archivo: `database/migrations/20261108_hu08_reporte_planillas.sql`.

La migración elimina y recrea únicamente la función, no el esquema ni los datos. Debe ejecutarse con el propietario del esquema o un rol de migraciones. La cuenta operativa `dpm_api` no tiene permiso para alterar funciones, por diseño de mínimo privilegio; la ejecución con `postgres` en la base local terminó con `BEGIN`, `DROP FUNCTION`, `CREATE FUNCTION`, `REVOKE`, `GRANT` y `COMMIT` exitosos.

## Pruebas ejecutadas

| Comprobación | Resultado |
|---|---|
| `npm run build` en la raíz | PASS; Vite compiló. Se conserva la advertencia existente de chunk grande. |
| `npm run lint` en la raíz | PASS; permanecen advertencias preexistentes. |
| `npm run build` backend | PASS |
| `npm run lint` backend | PASS |
| integración con PostgreSQL 16 local | PASS; 1 prueba, 0 fallos, 0 omitidas después de aplicar la migración |
| contrato del endpoint `/api/v1/reportes/periodo` | PASS; la prueba verifica la presencia de ambos campos nuevos |

Los datos usados son ficticios y locales. Esta evidencia no constituye validación empresarial de tarifas, reglas laborales ni criterios finales de conciliación.

## Evidencia visual adicional

La prueba E2E focalizada de Chromium verificó el acceso administrativo al reporte, los indicadores de planillas y el bloque de conciliación por cliente. Captura: `evidencias/cross-browser-chromium-admin-reportes-1366.png`.

Posteriormente se ejecutó la suite completa `npx playwright test e2e/roles.spec.ts` con 18 casos: 6 en Chromium, 6 en Firefox y 6 en WebKit. Resultado real: `18 passed` en 60,0 segundos. También se generaron las capturas equivalentes de reportes para Firefox y WebKit.

