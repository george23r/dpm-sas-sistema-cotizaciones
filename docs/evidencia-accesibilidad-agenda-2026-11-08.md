# Evidencia de accesibilidad de la agenda — 2026-11-08

## Cambio

La vista lista de `ProgramacionApiView` ya no depende de un `onClick` sobre una fila de tabla. Cada orden tiene un botón semántico con nombre accesible, foco visible y activación por teclado; el botón abre el panel lateral de detalle y asignación.

## Prueba navegable

```text
npx playwright test -g "administra el centro" --project=chromium
PASS — 1/1, 3,3 s
```

El caso cambia a vista lista, enfoca el botón `Ver orden ...`, lo activa con `Enter`, verifica el panel de asignación y lo cierra.

## Nota de entorno

La primera ejecución fue rechazada porque una prueba de revocación de sesión había desactivado intencionalmente el usuario ficticio administrador de la base local compartida. Se restauró el estado activo mediante `database/04_seed_e2e.sql` y se repitió la prueba con PASS. La CI usa una base PostgreSQL efímera y no comparte ese estado.

