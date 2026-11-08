# Auditoría de backend — Fase 0

**Fecha:** 2026-11-08 (America/Bogota)  
**Fuentes inspeccionadas:** checkout local, `origin/main` (`60e8ce4`) y rama `docs/corte-2-arquitectura-database` (`e5b8980`).

## Hallazgos verificables

| Elemento | Resultado |
|---|---|
| Backend Express/TypeScript | No existe en el checkout local ni en `origin/main`. |
| SQL local al iniciar la auditoría | No existía la carpeta `database/`; se incorporaron los artefactos de diseño desde la rama remota de Corte 2, sin mezclar el resto de cambios de frontend. |
| SQL autoritativo inspeccionado | `database/01_schema.sql`, con `DROP SCHEMA IF EXISTS dpm CASCADE`; solo es seguro para una base local de desarrollo/pruebas. |
| Tablas reales | 14: incluye `usuarios`, `clientes`, `servicios`, `zonas`, `cuadrillas`, `operarios`, `cotizaciones`, `visitas_tecnicas`, `cotizacion_lineas`, `cotizacion_costos`, `cotizacion_hitos`, `ordenes_trabajo`, `planillas_jornada` y `registros_jornada`. |
| Funciones/procedimientos/vistas | 5 funciones, 3 procedimientos, 5 vistas y 5 triggers según el SQL actual. Incluye envío/respuesta de cotizaciones, comparación/conciliación de planillas y reporte por periodo. |
| PostgreSQL local | `psql` no está instalado. |
| PostgreSQL temporal | Docker está instalado, pero el daemon no estaba iniciado; la ejecución real de `01_schema.sql` + `02_seed.sql` + `03_consultas_comprobacion.sql` quedó bloqueada y no se presenta como PASS. |
| Seed | `02_seed.sql` declara datos ficticios, tarifas ilustrativas y `password_hash` marcadores; no se puede usar para autenticación real. |

## Discrepancias entre la instrucción y el SQL real

La versión actual de `01_schema.sql` sí contiene las 14 tablas y los procedimientos/funciones de cotizaciones y planillas descritos en el alcance. La auditoría inicial había leído una versión anterior de la rama de documentación; queda corregida contra los archivos actualmente incorporados en el worktree.

El esquema actual soporta cotizaciones por objeto, alcance, líneas públicas, costos internos, hitos, visita técnica y vigencia; `sp_enviar_cotizacion` exige visita, líneas e hitos que sumen 100 %. Esta estructura se tratará como contrato SQL a validar mediante ejecución real antes de construir los repositorios.

El esquema sí respalda estas reglas:

- integridad de cliente/zona mediante FK compuesta;
- máximo un líder por cuadrilla mediante índice único parcial;
- no solapamiento de órdenes por trigger y `pg_advisory_xact_lock`;
- responsable de finalización perteneciente a la cuadrilla;
- historial y reporte mediante vistas/función;
- roles de base de datos `dpm_app` y `dpm_reportes`, distintos de `rol_usuario`.

## Decisión de implementación

La Fase 1 del backend se limita a servidor, configuración, conexión parametrizada, health/readiness, errores, cookie de sesión, autenticación y autorización sobre `dpm.usuarios`. Las fases siguientes pueden implementar cotizaciones, órdenes y planillas contra las tablas/procedimientos actuales; no se crearán tablas nuevas sin necesidad demostrada.

La prueba SQL completa debe ejecutarse en PostgreSQL 16 real o contenedor disponible antes de marcar la base como validada. `database/prueba_salida.txt` es evidencia registrada por el equipo, no una ejecución de esta sesión.
