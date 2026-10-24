# DPM SAS - Sistema de Cotizaciones

Sistema de información web para la gestión de cotizaciones, programación de servicios y control de jornadas en DPM S.A.S.

## Descripción

Este proyecto corresponde al trabajo de grado para optar al título de Ingeniero de Sistemas (Institución Universitaria Antonio José Camacho). El sistema permite elaborar y enviar cotizaciones por líneas (con visita técnica, pagos por hitos y vigencia), programar mantenimientos, asignar cuadrillas, consultar órdenes e historial de servicios, registrar y comparar planillas de jornada, y generar reportes.

## Autores

- Jorge Luis Ramos Perdomo
- Richard Esteban Sevillano Cuaran

## Metodología

El desarrollo se gestiona con Scrum. El Product Backlog y el detalle de las historias de usuario (HU-01 a HU-10) se encuentran documentados en `/docs`.

## Historias de usuario (Product Backlog)

| ID | Historia de usuario | Prioridad | Sprint |
|----|---------------------|-----------|--------|
| HU-01 | Elaborar y enviar cotización | Alta | 4 |
| HU-02 | Solicitar y responder cotización (cliente) | Alta | 4 |
| HU-03 | Programar mantenimiento | Alta | 5 |
| HU-04 | Asignar cuadrilla | Alta | 5 |
| HU-05 | Consultar órdenes asignadas | Media | 5 |
| HU-06 | Registrar ejecución del servicio | Media | 5 |
| HU-07 | Consultar historial de servicios | Media | 5 |
| HU-08 | Generar reporte por periodo | Baja | 5 |
| HU-09 | Registrar jornadas de campo | Media | 5 |
| HU-10 | Comparar y conciliar planillas | Media | 5 |

## Estructura del repositorio

- `/database`: scripts de la base de datos PostgreSQL, datos de prueba, pruebas, diccionario y diagramas.
- `/docs/arquitectura`: arquitectura, componentes, modelos UML y decisiones técnicas.
- `/docs/capturas`: capturas del prototipo de interfaz.
- `/src`: prototipo de la aplicación web.
- `BITACORA.md`: bitácora de trabajo del equipo.

## Control de versiones

Se usa una rama por historia de usuario, con el formato `feature/HU-XX-nombre-corto`, trazable directamente con el Product Backlog.

## Evidencias de diseño — Segundo corte

- [Arquitectura del sistema](docs/arquitectura/arquitectura-sistema.md): estado actual y arquitectura prevista.
- [Componentes, API y modelos UML](docs/arquitectura/diagrama-componentes.md): componentes, recursos de la API, casos de uso, estados, secuencias y trazabilidad.
- [Decisiones técnicas](docs/arquitectura/decisiones-tecnicas.md): registro de decisiones, seguridad y pendientes.
- [Base de datos PostgreSQL](database/README.md): scripts de reconstrucción, diccionario, diagramas entidad-relación y comprobaciones.

**Nota de alcance:** el frontend en `src/` es actualmente un prototipo con datos simulados; la API Express y la integración con PostgreSQL están diseñadas, pero no deben describirse como implementadas hasta comprobarlo. Los datos SQL de prueba son ficticios y no incluyen información real de DPM SAS ni de sus clientes.