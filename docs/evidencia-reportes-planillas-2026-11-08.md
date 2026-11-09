# Evidencia HU-08 â€” reporte de conciliaciÃ³n de planillas

Fecha: 2026-11-08  
Alcance: fase 4, ampliaciÃ³n del reporte de periodo.

## Cambio verificado

`dpm.fn_reporte_periodo(date, date, integer)` ahora devuelve tambiÃ©n:

- `planillas_conciliadas`: pares de planillas con estado `conciliada`.
- `diferencias_planillas`: pares en estado `en_comparacion`, que requieren revisiÃ³n.

El frontend administrativo muestra ambos indicadores junto con cotizaciones, servicios y horas. Los filtros de periodo y cliente se conservan y los datos provienen de la API cuando el modo demo estÃ¡ desactivado.

## MigraciÃ³n

Archivo: `database/migrations/20261108_hu08_reporte_planillas.sql`.

La migraciÃ³n elimina y recrea Ãºnicamente la funciÃ³n, no el esquema ni los datos. Debe ejecutarse con el propietario del esquema o un rol de migraciones. La cuenta operativa `dpm_api` no tiene permiso para alterar funciones, por diseÃ±o de mÃ­nimo privilegio; la ejecuciÃ³n con `postgres` en la base local terminÃ³ con `BEGIN`, `DROP FUNCTION`, `CREATE FUNCTION`, `REVOKE`, `GRANT` y `COMMIT` exitosos.

## Pruebas ejecutadas

| ComprobaciÃ³n | Resultado |
|---|---|
| `npm run build` en la raÃ­z | PASS; Vite compilÃ³. Se conserva la advertencia existente de chunk grande. |
| `npm run lint` en la raÃ­z | PASS; permanecen advertencias preexistentes. |
| `npm run build` backend | PASS |
| `npm run lint` backend | PASS |
| integraciÃ³n con PostgreSQL 16 local | PASS; 1 prueba, 0 fallos, 0 omitidas despuÃ©s de aplicar la migraciÃ³n |
| contrato del endpoint `/api/v1/reportes/periodo` | PASS; la prueba verifica la presencia de ambos campos nuevos |

Los datos usados son ficticios y locales. Esta evidencia no constituye validaciÃ³n empresarial de tarifas, reglas laborales ni criterios finales de conciliaciÃ³n.

## Evidencia visual adicional

La prueba E2E focalizada de Chromium verificÃ³ el acceso administrativo al reporte, los indicadores de planillas y el bloque de conciliaciÃ³n por cliente. Captura: `evidencias/cross-browser-chromium-admin-reportes-1366.png`.

Posteriormente se ejecutÃ³ la suite completa `npx playwright test e2e/roles.spec.ts` con 18 casos: 6 en Chromium, 6 en Firefox y 6 en WebKit. Resultado real de esa corrida histÃ³rica: `18 passed` en 60,0 segundos. TambiÃ©n se generaron las capturas equivalentes de reportes para Firefox y WebKit. La suite vigente tiene ocho escenarios por navegador; la ejecuciÃ³n mÃ¡s reciente produjo `22 passed`, `2 skipped`, `0 failed`, porque el escenario mutativo del operario se limita a Chromium.

