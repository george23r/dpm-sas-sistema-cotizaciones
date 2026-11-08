# Evidencia técnica — Fases 0 y 1

Fecha de ejecución: 2026-11-08, America/Bogota.

## Línea base

| Comprobación | Resultado |
|---|---|
| `npm run build` | PASS — Vite 8.3.4 genera `dist/` |
| `npm run test:unit` | PASS — 15 pruebas |
| `npm run lint` | PASS con advertencias no bloqueantes preexistentes y de React hooks |
| `npm run build --prefix backend` | PASS |
| `npm test --prefix backend` | PASS — 2 pruebas antes de añadir seguridad; 4 después |
| `npm run lint --prefix backend` | PASS |

## Auditoría SQL real

Se inspeccionó `database/01_schema.sql`, `02_seed.sql` y `03_consultas_comprobacion.sql`. El esquema declara 14 tablas, funciones, procedimientos, triggers, vistas y roles separados de `rol_usuario`. Se creó una base temporal PostgreSQL 16 dentro del contenedor `dpm-postgres` para no destruir datos existentes:

```text
dpm_codex_test_20261108
```

Sobre esa base se ejecutó el esquema, el seed ficticio y las consultas de comprobación. Resultado: C1–C18 y las 27 comprobaciones reportaron `PASS`.

La base persistida `dpm_sas` no se usa como evidencia limpia: ya tenía modificaciones y su ejecución aislada de comprobaciones falló en una cotización existente sin visita técnica. No se alteró esa base.

## Cambios de esta entrega

- Shell visual: paleta DPM Operations, navegación agrupada por proceso, breadcrumb contextual, estados de demo visibles y layout responsive.
- Login: composición responsive, validación, errores de API y sesión real mediante cookie; no usa localStorage.
- Panel administrativo: indicadores derivados de datos disponibles, agenda, actividad, cuadrillas y estados vacíos; sin crecimiento ni ingresos inventados.
- Cotizaciones: listado rediseñado; en modo no-demo consulta `GET /api/v1/cotizaciones`; el modo demo conserva el prototipo en memoria y queda rotulado.
- Backend: `/ready` público para disponibilidad de infraestructura, comparación CSRF exacta con soporte correcto para `Referer`, `search_path=dpm,public` en el pool y módulos HU-01/HU-02.
- Backend HU-01/HU-02: listado/detalle por propiedad, creación, visita, líneas, costos internos, hitos, envío y respuesta; el servidor delega las reglas críticas a `sp_enviar_cotizacion` y `sp_responder_cotizacion`.
- OpenAPI actualizado para health, readiness, autenticación y cotizaciones principales.

## Evidencia HTTP contra PostgreSQL temporal

Con un hash bcrypt efímero solo en la base temporal, se verificó:

```text
POST /api/v1/auth/login              200
GET  /api/v1/auth/me                 200
GET  /api/v1/cotizaciones            200
POST /api/v1/cotizaciones             201
POST /:id/visitas                     201
POST /:id/lineas                      201
POST /:id/hitos                       201
POST /:id/enviar                      200
GET  /:id                             200
GET  /ready sin sesión                200
Origen http://localhost:5173.evil    403
```

La primera ejecución encontró que los procedimientos SQL no resolvían tipos/tablas con el `search_path` por defecto. Se corrigió la conexión del pool y la repetición pasó.

## Brechas reales

- Órdenes, cuadrillas, operario, jornadas/conciliación, reportes HTTP y CRUD de apoyo aún no están expuestos por la API.
- El contexto de negocio todavía usa datos en memoria en la mayoría de pantallas; solo autenticación y el listado administrativo de cotizaciones consultan API.
- No se ha probado aún el flujo de respuesta con un cliente autenticado ni el control cruzado de clientes mediante integración automatizada con base real.
- No hay captura de navegador ni medición JMeter en esta entrega.
- Los datos del seed y los valores de servicios siguen siendo ficticios/ilustrativos.
- No se modificó documentación académica ni se marcaron objetivos como validados por DPM.
