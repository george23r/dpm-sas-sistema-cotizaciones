# Evidencia de navegaciÃ³n mensual de agenda

Fecha: 2026-11-08

Se corrigiÃ³ `src/pages/admin/ProgramacionApiView.tsx`: en vista mensual, los controles anterior/siguiente ahora cambian el mes calendario (`month Â± 1`) y posicionan el ancla en el dÃ­a 1. En vista semanal conservan el desplazamiento de siete dÃ­as.

VerificaciÃ³n:

- `npm run build`: PASS.
- `npm run test:unit`: 15/15 PASS en la corrida histÃ³rica; la suite actual tiene 16 pruebas.
- `npm run lint`: PASS con advertencias preexistentes.
- Playwright Chromium, flujo de centro operativo y agenda: `1 passed (3.4s)`; la prueba comprueba que el tÃ­tulo del mes cambia despuÃ©s de usar â€œPeriodo siguienteâ€.

