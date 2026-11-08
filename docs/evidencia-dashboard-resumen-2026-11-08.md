# Evidencia del resumen operativo — 2026-11-08

## Cambio

El centro operativo consulta `GET /api/v1/reportes/resumen` para sus conteos agregados y actividad temporal. Así, las tarjetas de cotizaciones y órdenes no se calculan sobre una página parcial del listado de cotizaciones.

El endpoint permite filtrar por `desde`, `hasta` y `clienteId`, exige rol administrador y devuelve:

- cotizaciones solicitadas, enviadas, aceptadas y pendientes de respuesta;
- órdenes programadas, en ejecución y finalizadas;
- actividad agrupada por fecha.

La lista de próximos servicios, cuadrillas y clientes continúa consultándose mediante sus endpoints propios para conservar el detalle de la interfaz.

## Verificación

```text
backend npm run build             PASS
backend npm run lint              PASS
backend npm run test:integration  PASS — 1/1 con PostgreSQL local
frontend npm run build            PASS
frontend npm run test:unit        PASS — 15/15
```

La prueba de integración valida el resumen filtrado por cliente y periodo. Los datos utilizados son ficticios y locales.

También se ejecutó el smoke E2E con API y Vite locales:

```text
npx playwright test --project=chromium
PASS — 4/4 pruebas, 8,1 s
```

Se verificaron el centro administrativo, aislamiento del portal cliente, órdenes del operario en viewport móvil y navegación por teclado del login.

