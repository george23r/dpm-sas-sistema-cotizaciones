# Evidencia de programaciÃ³n desde API â€” 2026-11-08

## Cambio verificado

La vista de programaciÃ³n fuera del modo demostraciÃ³n permite abrir `Programar servicio`, consultar cotizaciones aceptadas mediante `GET /api/v1/cotizaciones?estado=aceptada`, seleccionar fecha, horario y cuadrilla, y enviar `POST /api/v1/ordenes`. El cliente construye fechas ISO con zona `-05:00` para BogotÃ¡. La API y PostgreSQL siguen siendo responsables de validar aceptaciÃ³n, duplicados, concordancia de zona y solapes.

Si el servidor rechaza la operaciÃ³n, la interfaz conserva el formulario y muestra el mensaje de error; no presenta la orden como guardada.

## Pruebas ejecutadas

```powershell
npm run build
npm run lint
$env:E2E_BASE_URL='http://localhost:5173'; npx playwright test -g "administra el centro" --project=chromium
```

Resultados reales:

- Build: PASS.
- Lint: PASS con advertencias preexistentes documentadas.
- E2E Chromium: `1 passed (14.1s)`.

La prueba E2E comprueba la apertura del editor de programaciÃ³n, la presencia del selector de cotizaciÃ³n aceptada y el cierre accesible del diÃ¡logo. La creaciÃ³n efectiva contra PostgreSQL y el rechazo de solapes se verifican en las pruebas de integraciÃ³n del backend; esta prueba de navegador no crea datos persistentes para no contaminar el fixture local.


