# Evidencia de accesibilidad y teclado

Fecha: 2026-11-08  
Repositorio: `31b9009` + ajustes locales de esta evidencia  
Navegador probado: Chromium mediante Playwright  

## Verificaciones

- El CSS global conserva un indicador `:focus-visible` de 2 px con contraste sobre la interfaz.
- Las animaciones y transiciones se reducen cuando el usuario configura `prefers-reduced-motion: reduce`.
- La navegación móvil tiene un nombre accesible: `Navegación móvil`.
- El login permite pasar por correo, contraseña y acción de ingreso usando teclado.
- Estados de carga, error y confirmación relevantes usan regiones `status` o `alert` en las pantallas revisadas.
- La vista de detalle de agenda está marcada como diálogo con título accesible.
- Cada orden del portal operario se expone como botón de ancho completo, de modo que puede abrirse con teclado y mantiene un área táctil amplia en móvil.

## Resultado reproducible

Comando:

```text
npx playwright test e2e/roles.spec.ts -g "recorrer el login" --project=chromium
```

Resultado real: `1 passed (1.6s)`.

## Limitaciones

Esta comprobación no sustituye una auditoría WCAG completa ni pruebas manuales con lector de pantalla. El flujo de ingreso al portal operario requiere credenciales sembradas y una base PostgreSQL de prueba; en la ejecución local de esta sesión la API respondió `INVALID_CREDENTIALS` para el usuario de ejemplo, por lo que se validó de forma independiente el recorrido de teclado del login. Las pruebas E2E de roles y persistencia que ya estaban documentadas permanecen como evidencia separada.
