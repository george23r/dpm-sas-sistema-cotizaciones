# Evidencia HU-01 — editor multipaso de cotizaciones

Fecha de ejecución: 2026-11-08, America/Bogota.

## Recorrido verificado

El escenario E2E `admin puede recorrer el editor de cotizaciones por pasos` inicia sesión como administrador con cookie HttpOnly y comprueba, sin crear datos persistentes:

1. Cliente y zona.
2. Visita técnica.
3. Alcance.
4. Conceptos con cantidad, valor unitario y subtotal.
5. Costos internos restringidos a administración.
6. Hitos y vigencia, incluyendo suma del 100 %.
7. Revisión, vista previa y total al cliente.

También se corrigió el helper de login para esperar la redirección al portal antes de navegar a la pantalla siguiente.

## Resultado

```text
npx playwright test e2e/roles.spec.ts -g "recorrer el editor"
3 passed (13.8s)

npx playwright test e2e/roles.spec.ts
21 passed (1.1m)
```

La prueba focalizada pasó en Chromium, Firefox y WebKit. La evidencia histórica de la suite completa que aparece arriba corresponde a una versión anterior del arnés; la suite vigente contiene ocho escenarios funcionales por navegador y el último resultado documentado fue `22 passed`, `2 skipped`, `0 failed` para roles, más `3 passed` del smoke Axe de accesibilidad. Las capturas fueron tomadas con `E2E_CAPTURE=1`:

- `evidencias/cross-browser-chromium-admin-editor-cotizacion-1366.png`
- `evidencias/cross-browser-firefox-admin-editor-cotizacion-1366.png`
- `evidencias/cross-browser-webkit-admin-editor-cotizacion-1366.png`

La creación y envío contra PostgreSQL, incluyendo visita, líneas, costos, hitos, restricciones de edición y respuesta del cliente, se verifica por separado en `backend/tests/integration.test.ts`. Esta evidencia visual no valida tarifas ni reglas empresariales pendientes de confirmación con DPM.

