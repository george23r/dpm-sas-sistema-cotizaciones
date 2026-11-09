# Evidencia del resumen operativo â€” 2026-11-08

## Cambio

El centro operativo consulta `GET /api/v1/reportes/resumen` para sus conteos agregados y actividad temporal. AsÃ­, las tarjetas de cotizaciones y Ã³rdenes no se calculan sobre una pÃ¡gina parcial del listado de cotizaciones.

El endpoint permite filtrar por `desde`, `hasta` y `clienteId`, exige rol administrador y devuelve:

- cotizaciones solicitadas, enviadas, aceptadas y pendientes de respuesta;
- Ã³rdenes programadas, en ejecuciÃ³n y finalizadas;
- actividad agrupada por fecha.

La lista de prÃ³ximos servicios, cuadrillas y clientes continÃºa consultÃ¡ndose mediante sus endpoints propios para conservar el detalle de la interfaz.

## VerificaciÃ³n

```text
backend npm run build             PASS
backend npm run lint              PASS
backend npm run test:integration  PASS â€” 1/1 con PostgreSQL local
frontend npm run build            PASS
frontend npm run test:unit        PASS â€” 15/15 (corrida histÃ³rica; la suite actual tiene 16 pruebas)
```

La prueba de integraciÃ³n valida el resumen filtrado por cliente y periodo. Los datos utilizados son ficticios y locales.

TambiÃ©n se ejecutÃ³ el smoke E2E con API y Vite locales:

```text
npx playwright test --project=chromium
PASS â€” 4/4 pruebas, 8,1 s
```

Se verificaron el centro administrativo, aislamiento del portal cliente, Ã³rdenes del operario en viewport mÃ³vil y navegaciÃ³n por teclado del login.

