# Evidencia de filtros de agenda en API

Fecha: 2026-11-08

HU-03 ahora acepta filtros parametrizados en `GET /api/v1/ordenes`:

- `estado`
- `clienteId`
- `cuadrillaId`

La autorización por rol y propiedad permanece en el controlador; los filtros se agregan como parámetros SQL y no como interpolación de valores de usuario. La agenda React envía los filtros activos y conserva el filtrado local para la respuesta visual.

Verificación real:

- Backend build: PASS.
- Backend lint: PASS.
- Backend unitarias: 4 PASS, 1 SKIP opt-in.
- Integración PostgreSQL local: `1 passed`, `0 failed`, `0 skipped`.
- El caso integrado comprobó una consulta combinando cliente, cuadrilla y estado.

También se corrigió la integración para generar periodos ficticios no repetidos; antes una segunda ejecución fallaba por la restricción única de planillas, aunque el código estuviera correcto.
