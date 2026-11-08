# Evidencia de reintento del portal operario â€” 2026-11-08

## Alcance

Se verificÃ³ que el portal mobile-first del operario no presenta un guardado ficticio cuando falla la red. La carga de `GET /api/v1/ordenes/mias` conserva el estado sin Ã³rdenes actualizadas, muestra un error accesible y ofrece `Reintentar`. En el detalle de una orden, los fallos de iniciar o finalizar conservan la orden sin cambiar y ofrecen reintentar la misma operaciÃ³n.

## Prueba ejecutada

Comando:

```powershell
$env:E2E_BASE_URL='http://localhost:5173'; npx playwright test -g "operario puede reintentar" --project=chromium
```

Resultado real:

```text
1 passed (2.6s)
```

La prueba aborta intencionalmente la primera solicitud de Ã³rdenes mediante Playwright, comprueba el mensaje de error y pulsa `Reintentar`. La segunda solicitud continÃºa hacia la API y el portal muestra los servicios asignados.

## ObservaciÃ³n de entorno

La prueba requiere `E2E_BASE_URL=http://localhost:5173` porque el backend local tiene `CORS_ORIGIN=http://localhost:5173`. Con el valor predeterminado `127.0.0.1` se rechazÃ³ correctamente la solicitud por origen no permitido; no se modificÃ³ esa polÃ­tica de seguridad para hacer pasar la prueba.


