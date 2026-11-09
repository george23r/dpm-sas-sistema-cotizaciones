# Evidencia de accesibilidad automatizada — 2026-11-08

## Resultado

Se ejecutó el smoke automatizado de accesibilidad con Playwright y `@axe-core/playwright` sobre los tres portales:

```text
npx playwright test e2e/accessibility.spec.ts --project=chromium
1 passed
```

La prueba revisa:

- Centro operativo administrativo a 1366 × 900.
- Portal del cliente a 360 × 800.
- Portal del operario a 360 × 800.

También se ejecutó la suite E2E completa:

```text
npx playwright test
23 passed, 4 skipped, 0 failed
```

Los cuatro skips son intencionales: el smoke Axe se limita a Chromium y la prueba mutativa de iniciar/finalizar una orden se limita a Chromium para evitar alterar el estado compartido en Firefox y WebKit.

## Correcciones aplicadas

- Se ajustó el texto secundario a `#5f6d69` para cumplir el contraste normal sobre superficies claras.
- Se ajustaron los colores de estados pendiente y en progreso para mejorar el contraste con sus fondos.
- `CardTitle` utiliza `h2` para conservar una jerarquía de encabezados válida dentro del App Shell.
- Se añadió el límite de intentos de login configurable mediante `LOGIN_RATE_LIMIT_MAX`, evitando que la suite de navegador bloquee el usuario de prueba por configuración fija.

## Alcance y limitaciones

Esta evidencia es un smoke automatizado de reglas Axe, no una certificación WCAG completa. No sustituye la revisión manual con teclado, lector de pantalla, Edge, Safari iOS y dispositivos físicos. Los datos utilizados son ficticios de desarrollo/prueba y no constituyen validación empresarial.
