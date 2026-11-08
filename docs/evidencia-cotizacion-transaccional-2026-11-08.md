# Evidencia de creación transaccional de cotizaciones — 2026-11-08

## Cambio

El editor administrativo puede enviar en una sola solicitud la cotización, visita técnica, líneas, costos internos, hitos y decisión de envío. La API ejecuta esas operaciones dentro de una transacción PostgreSQL. Los endpoints individuales (`/visitas`, `/lineas`, `/costos`, `/hitos` y `/enviar`) se conservan para compatibilidad y operaciones posteriores.

Si el envío no cumple las reglas de la base de datos, la transacción se revierte y la cotización compuesta no queda creada parcialmente.

## Pruebas

```text
backend npm run build             PASS
backend npm run lint              PASS
backend npm run test:integration  PASS — 1/1, 0 fallos, 0 omitidos
frontend npm run build            PASS
frontend npm run test:unit        PASS — 15/15
```

La integración comprueba:

- creación compuesta con visita, línea, hito al 100 % y envío: `201`, estado `enviada`;
- envío compuesto sin hitos: `409 QUOTE_SEND_BLOCKED`;
- búsqueda posterior del objeto fallido: total `0`, confirmando rollback.

Los datos son ficticios y se ejecutaron contra PostgreSQL local de pruebas.

