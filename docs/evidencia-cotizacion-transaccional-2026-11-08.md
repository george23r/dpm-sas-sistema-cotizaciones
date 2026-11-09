# Evidencia de creaciÃ³n transaccional de cotizaciones â€” 2026-11-08

## Cambio

El editor administrativo puede enviar en una sola solicitud la cotizaciÃ³n, visita tÃ©cnica, lÃ­neas, costos internos, hitos y decisiÃ³n de envÃ­o. La API ejecuta esas operaciones dentro de una transacciÃ³n PostgreSQL. Los endpoints individuales (`/visitas`, `/lineas`, `/costos`, `/hitos` y `/enviar`) se conservan para compatibilidad y operaciones posteriores.

Si el envÃ­o no cumple las reglas de la base de datos, la transacciÃ³n se revierte y la cotizaciÃ³n compuesta no queda creada parcialmente.

## Pruebas

```text
backend npm run build             PASS
backend npm run lint              PASS
backend npm run test:integration  PASS â€” 1/1, 0 fallos, 0 omitidos
frontend npm run build            PASS
frontend npm run test:unit        PASS â€” 15/15 (corrida histÃ³rica; la suite actual tiene 16 pruebas)
```

La integraciÃ³n comprueba:

- creaciÃ³n compuesta con visita, lÃ­nea, hito al 100 % y envÃ­o: `201`, estado `enviada`;
- envÃ­o compuesto sin hitos: `409 QUOTE_SEND_BLOCKED`;
- bÃºsqueda posterior del objeto fallido: total `0`, confirmando rollback.

Los datos son ficticios y se ejecutaron contra PostgreSQL local de pruebas.

