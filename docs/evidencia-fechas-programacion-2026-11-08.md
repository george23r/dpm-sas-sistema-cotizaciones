# Evidencia de fechas en programación

Fecha: 2026-11-08

Se corrigieron las inicializaciones de fecha de `src/pages/admin/Programacion.tsx` y `src/pages/admin/ProgramacionApiView.tsx` usando inicializadores perezosos de React. La fecha se sigue formateando con `America/Bogota`; no se cambió la regla de negocio ni se introdujeron fechas ficticias.

Verificación:

- `npm run lint`: PASS; desaparecieron las dos advertencias de pureza asociadas a `new Date()` durante el render de programación.
- `npm run build`: PASS.
- `npm run test:unit`: 15/15 PASS.
- Playwright Chromium, prueba de centro operativo y agenda: `1 passed (5.1s)`.

El lint aún reporta advertencias preexistentes en otros módulos; no se presentan como errores ni como resueltas por este cambio.
