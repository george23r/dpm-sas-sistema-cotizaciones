# Evidencia de catálogo y trabajadores — 2026-11-08

## Alcance

La navegación administrativa real comprobó:

- `GET /api/v1/operarios` y `GET /api/v1/cuadrillas` en la pantalla de trabajadores.
- `GET /api/v1/servicios` en el catálogo, con siete servicios ficticios del entorno de desarrollo.
- Advertencia visible de que unidades y tarifas están pendientes de validación con DPM; no se presentan como políticas aprobadas.
- Persistencia y permisos de administración existentes para trabajadores y cuadrillas.

## Prueba de navegador

La prueba `e2e/roles.spec.ts` verificó el flujo de administrador en Chromium, Firefox y WebKit. Resultado de la ejecución limpia: `18 passed` en aproximadamente un minuto.

Capturas generadas:

- `evidencias/cross-browser-chromium-admin-trabajadores-1366.png`
- `evidencias/cross-browser-firefox-admin-trabajadores-1366.png`
- `evidencias/cross-browser-webkit-admin-trabajadores-1366.png`
- `evidencias/cross-browser-chromium-admin-servicios-1366.png`
- `evidencias/cross-browser-firefox-admin-servicios-1366.png`
- `evidencias/cross-browser-webkit-admin-servicios-1366.png`

Los datos son ficticios y locales. La pantalla de servicios es de consulta; no se habilitan tarifas ni reglas empresariales no confirmadas.

