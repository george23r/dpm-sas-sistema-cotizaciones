# Evidencia de selecciÃ³n de periodo en jornadas

Fecha: 2026-11-08

Se corrigiÃ³ `src/pages/admin/JornadasApiView.tsx`: al consultar planillas, la interfaz ahora selecciona la pareja campo/administrativa que coincide simultÃ¡neamente con el cliente, `desde` y `hasta` visibles. Antes tomaba la primera planilla de cada origen y podÃ­a comparar periodos diferentes.

La carga se actualiza cuando cambia el cliente o cualquiera de las fechas. La funciÃ³n quedÃ³ estabilizada con `useCallback` para evitar capturas obsoletas del periodo.

VerificaciÃ³n:

- `npm run build`: PASS.
- `npm run lint`: PASS; no quedan advertencias de dependencias del efecto de carga de jornadas.
- `npm run test:unit`: 15/15 PASS en la corrida histÃ³rica; la suite actual tiene 16 pruebas.
- La integraciÃ³n backend previamente ejecutada contra PostgreSQL local continÃºa en `1 passed`, `0 failed`, `0 skipped`.

No se inventaron reglas de recargos ni se habilitÃ³ facturaciÃ³n.

