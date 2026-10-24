# Base de datos — DPM SAS (versión 2)

Sistema de información web para la gestión de cotizaciones, programación de servicios y control de jornadas.
Trabajo de Grado I — Corte 2 — Objetivo específico 2 (diseño del sistema).

**Motor:** PostgreSQL 14 o superior (probado en PostgreSQL 16). **Esquema:** `dpm`. **14 tablas, 109 columnas.**

## Contenido

| Archivo | Descripción |
|---|---|
| `01_schema.sql` | Esquema completo: tipos, tablas, restricciones, índices, disparadores, funciones, procedimientos, vistas, permisos y comentarios. |
| `02_seed.sql` | Datos de prueba **ficticios**. Valores en pesos y unidades de cobro **ilustrativos**. |
| `03_consultas_comprobacion.sql` | 18 pruebas automáticas (27 comprobaciones PASS/FAIL) y consultas de ejemplo. |
| `diccionario_datos.md` | Diccionario de datos generado desde el catálogo de la base. |
| `er_cotizaciones.png`, `er_ejecucion.png` | Diagrama entidad-relación dividido en dos figuras legibles. |
| `diagrama_er_completo.png` | Diagrama entidad-relación completo. |
| `prueba_salida.txt` | Salida de la ejecución de las pruebas (evidencia). |

## Cómo reconstruir la base (reproducible)

```bash
createdb dpm_sas
psql -d dpm_sas -v ON_ERROR_STOP=1 -f 01_schema.sql
psql -d dpm_sas -v ON_ERROR_STOP=1 -f 02_seed.sql
psql -d dpm_sas -v ON_ERROR_STOP=1 -f 03_consultas_comprobacion.sql
```

`01_schema.sql` borra y recrea el esquema `dpm`: úselo solo en desarrollo.

## Qué cambió respecto a la versión 1

La entrevista con DPM SAS (23 y 24 de octubre de 2026) mostró que la cotización no se calcula con una fórmula por metros cuadrados:

- **Cotización por líneas** (`cotizacion_lineas`): concepto, cantidad, valor unitario y valor total.
- **Análisis interno de costos** (`cotizacion_costos`): mano de obra, maquinaria, herramientas, combustible y transporte; no lo ve el cliente.
- **Forma de pago por hitos** (`cotizacion_hitos`): deben sumar 100 %.
- **Visita técnica previa** (`visitas_tecnicas`) y **vigencia de 15 días**.
- **Control de jornadas** (`planillas_jornada`, `registros_jornada`): planilla de campo y administrativa, que se comparan antes de facturar.

## Reglas de negocio en la base de datos

| Historia | Regla | Mecanismo |
|---|---|---|
| HU-01 | Total = suma de las líneas; se exige visita técnica, líneas e hitos = 100 %; precio fijo una vez enviada | trigger `fn_recalcular_total`, `sp_enviar_cotizacion` |
| HU-02 | Solo se acepta dentro de la vigencia | `sp_responder_cotizacion` |
| HU-03 | Orden solo desde cotización aceptada; sin cruce de horarios por cuadrilla | trigger `trg_ordenes_validar` |
| HU-04 | Orden en ejecución o finalizada requiere cuadrilla | `CHECK` en `ordenes_trabajo` |
| HU-05 | El operario solo ve las órdenes de su cuadrilla | vista `v_ordenes_operario` |
| HU-06 | Al finalizar: fecha, hora y responsable de la cuadrilla | `CHECK` + trigger |
| HU-07 | Historial de servicios finalizados por cliente | vista `v_historial_servicios` |
| HU-08 | Reporte de cotizaciones, servicios y horas por periodo | función `fn_reporte_periodo` |
| HU-09 | Horas del turno calculadas (incluye turnos que cruzan la medianoche) | columna calculada `registros_jornada.horas` |
| HU-10 | Comparación y conciliación de planillas | `fn_comparar_planillas`, `sp_conciliar_planillas` |
| RNF-02 | Contraseñas solo como hash | columna `password_hash` |
| RNF-04 | Perfiles de acceso | roles `dpm_app` y `dpm_reportes` |

## Antes de pasar a producción

1. Reemplazar los valores de `02_seed.sql` por los reales de DPM SAS (tarifas, unidades de cobro) una vez validados.
2. Crear los usuarios de conexión de la API: `CREATE ROLE dpm_api LOGIN PASSWORD '...' IN ROLE dpm_app;`
3. Almacenar las contraseñas con un hash seguro (por ejemplo, bcrypt) desde la aplicación.
4. Si se prefiere la restricción declarativa de cruce de horarios, habilitar `btree_gist` (ver comentario en `01_schema.sql`).