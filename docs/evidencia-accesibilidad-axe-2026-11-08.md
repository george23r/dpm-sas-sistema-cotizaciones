# Evidencia de accesibilidad automatizada — 2026-11-08

## Resultado

Se ejecutó el smoke automatizado de accesibilidad con Playwright y `@axe-core/playwright` sobre los tres portales:

```text
npx playwright test e2e/accessibility.spec.ts --project=chromium
1 passed
```

La misma prueba se ejecutó después en los tres motores:

```text
npx playwright test e2e/accessibility.spec.ts
3 passed, 0 failed
```

La prueba revisa:

- Centro operativo administrativo a 1366 × 900.
- Portal del cliente a 360 × 800.
- Portal del operario a 360 × 800.

También se ejecutó la suite E2E completa:

```text
npx playwright test
25 passed, 2 skipped, 0 failed
```

Los dos skips son intencionales: la prueba mutativa de iniciar/finalizar una orden se limita a Chromium para evitar alterar el estado compartido en Firefox y WebKit. El smoke Axe sí se ejecuta en Chromium, Firefox y WebKit.

## Correcciones aplicadas

- Se ajustó el texto secundario a `#5f6d69` para cumplir el contraste normal sobre superficies claras.
- Se ajustaron los colores de estados pendiente, en progreso y error para mejorar el contraste con sus fondos.
- Se eliminó la opacidad del subtítulo de marca en el login y de controles deshabilitados para no reducir el contraste efectivo.
- `CardTitle` utiliza `h2` para conservar una jerarquía de encabezados válida dentro del App Shell.
- Se añadió el límite de intentos de login configurable mediante `LOGIN_RATE_LIMIT_MAX`; producción conserva el valor predeterminado de 20 y CI usa 100 para cubrir todas las sesiones E2E sin desactivar la protección.

## Alcance y limitaciones

Esta evidencia es un smoke automatizado de reglas Axe, no una certificación WCAG completa. No sustituye la revisión manual con teclado, lector de pantalla, Edge, Safari iOS y dispositivos físicos. Los datos utilizados son ficticios de desarrollo/prueba y no constituyen validación empresarial.
