# Evidencia de selección de periodo en jornadas

Fecha: 2026-11-08

Se corrigió `src/pages/admin/JornadasApiView.tsx`: al consultar planillas, la interfaz ahora selecciona la pareja campo/administrativa que coincide simultáneamente con el cliente, `desde` y `hasta` visibles. Antes tomaba la primera planilla de cada origen y podía comparar periodos diferentes.

La carga se actualiza cuando cambia el cliente o cualquiera de las fechas. La función quedó estabilizada con `useCallback` para evitar capturas obsoletas del periodo.

Verificación:

- `npm run build`: PASS.
- `npm run lint`: PASS; no quedan advertencias de dependencias del efecto de carga de jornadas.
- `npm run test:unit`: 15/15 PASS.
- La integración backend previamente ejecutada contra PostgreSQL local continúa en `1 passed`, `0 failed`, `0 skipped`.

No se inventaron reglas de recargos ni se habilitó facturación.
