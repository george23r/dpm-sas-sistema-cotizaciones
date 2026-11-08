# Evidencia de activaciÃ³n de cuadrillas â€” 2026-11-08

## Cambio

La pantalla API de cuadrillas ahora permite editar el nombre y el estado activo de una cuadrilla. Las cuadrillas inactivas siguen visibles para consulta, pero no aparecen como opciÃ³n de asignaciÃ³n de nuevas Ã³rdenes. La operaciÃ³n usa `PATCH /api/v1/cuadrillas/:id`; el servidor conserva la autorizaciÃ³n administrativa.

## Prueba ejecutada

```powershell
npm run build
$env:E2E_BASE_URL='http://localhost:5173'; npx playwright test -g "administra el centro" --project=chromium
```

Resultado real:

```text
Build: PASS
E2E Chromium: 1 passed (4.3s)
```

La prueba abriÃ³ el mÃ³dulo de cuadrillas desde la sesiÃ³n administrativa real y verificÃ³ la presencia del control `Activa`. No se modificÃ³ una cuadrilla persistente durante la prueba.

Capturas generadas por la misma ejecuciÃ³n:

- `evidencias/cross-browser-chromium-admin-cuadrillas-1366.png`
- `evidencias/cross-browser-firefox-admin-cuadrillas-1366.png`
- `evidencias/cross-browser-webkit-admin-cuadrillas-1366.png`


