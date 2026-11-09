# Evidencia de filtros y paginaciÃ³n de cotizaciones â€” 2026-11-08

## Alcance

El listado de cotizaciones ya no descarga todo el conjunto para buscarlo en el navegador cuando la aplicaciÃ³n estÃ¡ conectada a la API. `GET /api/v1/cotizaciones` acepta filtros parametrizados de estado, cliente, texto, fecha inicial, fecha final, pÃ¡gina y tamaÃ±o de pÃ¡gina.

La respuesta conserva `data` y agrega:

```json
{ "meta": { "page": 1, "pageSize": 25, "total": 0, "totalPages": 0 } }
```

El servidor aplica el alcance por rol y usa `ILIKE`, `LIMIT` y `OFFSET` con parÃ¡metros de PostgreSQL. La interfaz administrativa muestra bÃºsqueda, estado, periodo y navegaciÃ³n anterior/siguiente.

## VerificaciÃ³n

```text
npm run build       PASS
npm run lint        PASS con advertencias existentes del frontend
npm run test:unit   PASS â€” 15/15 (corrida histÃ³rica; la suite actual tiene 16 pruebas)
npm run test:integration PASS â€” 1/1 con PostgreSQL local, 0 fallos
```

La prueba de integraciÃ³n consulta `search=IntegraciÃ³n&page=1&pageSize=1` y comprueba `meta.pageSize`, `meta.total` y que la cantidad de registros no supera el lÃ­mite solicitado.

TambiÃ©n se ejecutÃ³ el flujo navegable administrativo con la API y Vite locales:

```text
npx playwright test -g "administra el centro" --project=chromium
PASS â€” 1 prueba, 5.9 s
```

El flujo inicia sesiÃ³n, abre el centro operativo, navega la agenda y consulta el detalle de una cotizaciÃ³n desde la interfaz.

## LÃ­mites

La evidencia usa datos ficticios en una base local. No representa volumen de producciÃ³n ni sustituye una prueba de carga con datos reales anonimizados.

