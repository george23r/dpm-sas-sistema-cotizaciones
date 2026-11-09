# Evidencia HU-09/HU-10 — validación de pares de planillas

Fecha de ejecución: 2026-11-08, America/Bogota.

## Cambio verificado

`GET /api/v1/planillas/comparar` ahora valida antes de invocar `fn_comparar_planillas` que:

- existan ambas planillas;
- `campoId` corresponda a origen `campo` y `adminId` a origen `administrativa`;
- pertenezcan al mismo cliente y periodo;
- no se use el mismo identificador para ambos lados.

Si el par no es válido, responde `409 PLANILLA_PAIR_INVALID`. La creación de una planilla individual también rechaza periodos invertidos con `422 VALIDATION_ERROR`, además del `CHECK` existente en PostgreSQL.

## Pruebas ejecutadas

| Comprobación | Resultado |
|---|---|
| `npm run build` en `backend/` | PASS |
| `npm run lint` en `backend/` | PASS |
| `npm test` en `backend/` | PASS: 5, 1 integración omitida por ser opt-in |
| `RUN_INTEGRATION=1 npm run test:integration` contra PostgreSQL 16 local | PASS: 1/1 |
| Comparación de par válido | HTTP 200, resultado `coincide` |
| Comparación de par con periodo distinto | HTTP 409, código `PLANILLA_PAIR_INVALID` |
| Conciliación con diferencias | HTTP 409, código `RECONCILIATION_BLOCKED` |
| `03_consultas_comprobacion.sql` sobre `01_schema.sql` + `02_seed.sql` | PASS C1–C18; 27 comprobaciones según el script |

La base utilizada fue una instancia Docker local con datos ficticios. Se reconstruyó con los scripts de desarrollo; no se ejecutó `DROP SCHEMA` sobre una base productiva.

## Archivos

- `backend/src/modules/planillas/planillas.controller.ts`
- `backend/tests/integration.test.ts`
- `backend/openapi.yaml`

Commit local: `ea6d850 fix: validate planilla comparison pairs`.

Esta evidencia no constituye validación empresarial de tarifas, recargos ni permisos laborales; esas reglas continúan pendientes de confirmación con DPM.

