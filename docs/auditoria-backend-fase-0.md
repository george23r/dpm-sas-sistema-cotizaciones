# Auditoría de backend — Fase 0

Fecha: 2026-11-08 (America/Bogota).

## Hallazgos verificables

| Elemento | Resultado |
|---|---|
| Backend | Existe en `backend/`, Express + TypeScript + `pg`, con autenticación y HU-01/HU-02 iniciales. |
| SQL autoritativo | `database/01_schema.sql`; contiene `DROP SCHEMA IF EXISTS dpm CASCADE`, solo para bases locales de desarrollo/pruebas. |
| Tablas | 14: usuarios, clientes, servicios, zonas, cuadrillas, operarios, cotizaciones, visitas_tecnicas, cotizacion_lineas, cotizacion_costos, cotizacion_hitos, ordenes_trabajo, planillas_jornada y registros_jornada. |
| Objetos programables | 5 funciones, 3 procedimientos, 5 vistas y 5 triggers según el SQL. |
| PostgreSQL local | PostgreSQL 16 disponible mediante Docker, contenedor `dpm-postgres`. |
| Seed | Ficticio; tarifas/unidades ilustrativas y hashes marcadores. No representa políticas de DPM. |

## Ejecución de regresión SQL

Se creó la base temporal `dpm_codex_test_20261108`, se aplicaron `01_schema.sql` y `02_seed.sql`, y se ejecutó `03_consultas_comprobacion.sql` con `ON_ERROR_STOP=1`. Las comprobaciones C1–C18 y sus 27 checks reportaron `PASS`.

La base persistida `dpm_sas` no se reinició ni se sometió a `DROP SCHEMA`. Allí una comprobación aislada falló porque una cotización existente no tenía visita técnica; ese resultado se considera dato preexistente, no evidencia limpia del SQL.

## Discrepancias y decisiones

- El esquema real sí soporta las 14 tablas, líneas públicas, costos internos, hitos, visitas, órdenes, jornadas, conciliación y reporte.
- `rol_usuario` y los roles PostgreSQL `dpm_app`/`dpm_reportes` son conceptos distintos.
- Los procedimientos contienen referencias relativas a `dpm`; el pool de la API fija `search_path=dpm,public` para que triggers y procedimientos funcionen desde Node.
- El cliente no recibe `cotizacion_costos` en las respuestas de detalle.
- No se agregaron tablas ni migraciones destructivas.

## Estado de fase

PASS: health/readiness, cookie de sesión, autenticación, roles, autorización por propiedad en cotizaciones, cotización por líneas/visita/costos/hitos, envío y respuesta por procedimientos existentes.

Pendiente: órdenes/cuadrillas, operario, planillas/conciliación, reportes HTTP, CRUD de apoyo, integración del resto del frontend y pruebas E2E de navegador.
