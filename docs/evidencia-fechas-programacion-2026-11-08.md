# Evidencia de fechas en programaciÃ³n

Fecha: 2026-11-08

Se corrigieron las inicializaciones de fecha de `src/pages/admin/Programacion.tsx` y `src/pages/admin/ProgramacionApiView.tsx` usando inicializadores perezosos de React. La fecha se sigue formateando con `America/Bogota`; no se cambiÃ³ la regla de negocio ni se introdujeron fechas ficticias.

VerificaciÃ³n:

- `npm run lint`: PASS; desaparecieron las dos advertencias de pureza asociadas a `new Date()` durante el render de programaciÃ³n.
- `npm run build`: PASS.
- `npm run test:unit`: 15/15 PASS en la corrida histÃ³rica; la suite actual tiene 16 pruebas.
- Playwright Chromium, prueba de centro operativo y agenda: `1 passed (5.1s)`.

El lint aÃºn reporta advertencias preexistentes en otros mÃ³dulos; no se presentan como errores ni como resueltas por este cambio.

