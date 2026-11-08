# Evidencia de filtros y paginación de cotizaciones — 2026-11-08

## Alcance

El listado de cotizaciones ya no descarga todo el conjunto para buscarlo en el navegador cuando la aplicación está conectada a la API. `GET /api/v1/cotizaciones` acepta filtros parametrizados de estado, cliente, texto, fecha inicial, fecha final, página y tamaño de página.

La respuesta conserva `data` y agrega:

```json
{ "meta": { "page": 1, "pageSize": 25, "total": 0, "totalPages": 0 } }
```

El servidor aplica el alcance por rol y usa `ILIKE`, `LIMIT` y `OFFSET` con parámetros de PostgreSQL. La interfaz administrativa muestra búsqueda, estado, periodo y navegación anterior/siguiente.

## Verificación

```text
npm run build       PASS
npm run lint        PASS con advertencias existentes del frontend
npm run test:unit   PASS — 15/15
npm run test:integration PASS — 1/1 con PostgreSQL local, 0 fallos
```

La prueba de integración consulta `search=Integración&page=1&pageSize=1` y comprueba `meta.pageSize`, `meta.total` y que la cantidad de registros no supera el límite solicitado.

También se ejecutó el flujo navegable administrativo con la API y Vite locales:

```text
npx playwright test -g "administra el centro" --project=chromium
PASS — 1 prueba, 5.9 s
```

El flujo inicia sesión, abre el centro operativo, navega la agenda y consulta el detalle de una cotización desde la interfaz.

## Límites

La evidencia usa datos ficticios en una base local. No representa volumen de producción ni sustituye una prueba de carga con datos reales anonimizados.

