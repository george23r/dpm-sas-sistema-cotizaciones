# Evidencia de navegación mensual de agenda

Fecha: 2026-11-08

Se corrigió `src/pages/admin/ProgramacionApiView.tsx`: en vista mensual, los controles anterior/siguiente ahora cambian el mes calendario (`month ± 1`) y posicionan el ancla en el día 1. En vista semanal conservan el desplazamiento de siete días.

Verificación:

- `npm run build`: PASS.
- `npm run test:unit`: 15/15 PASS.
- `npm run lint`: PASS con advertencias preexistentes.
- Playwright Chromium, flujo de centro operativo y agenda: `1 passed (3.4s)`; la prueba comprueba que el título del mes cambia después de usar “Periodo siguiente”.
