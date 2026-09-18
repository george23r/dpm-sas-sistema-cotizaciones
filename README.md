# DPM SAS - Sistema de Cotizaciones

Sistema de información web para la gestión de cotizaciones y mantenimiento de zonas verdes en DPM S.A.S.

## Descripción

Este proyecto corresponde al trabajo de grado para optar al título de Ingeniero de Sistemas (Institución Universitaria Antonio José Camacho). El sistema permite gestionar el ciclo completo de cotizaciones y mantenimiento de zonas verdes: solicitud y registro de cotizaciones, programación de mantenimientos, asignación de cuadrillas, consulta de órdenes e historial de servicios, y generación de reportes.

## Autores

- Jorge Luis Ramos Perdomo
- Richard Esteban Sevillano Cuaran

## Metodología

El desarrollo se gestiona con Scrum. El Product Backlog y el detalle de las historias de usuario (HU-01 a HU-08) se encuentran documentados en `/docs`.

## Historias de usuario (Product Backlog)

| ID | Historia de usuario | Prioridad | Sprint |
|----|----------------------|-----------|--------|
| HU-01 | Registrar cotización | Alta | 4 |
| HU-02 | Solicitar cotización (cliente) | Alta | 4 |
| HU-03 | Programar mantenimiento | Alta | 5 |
| HU-04 | Asignar cuadrilla | Alta | 5 |
| HU-05 | Consultar órdenes asignadas | Media | 5 |
| HU-06 | Registrar ejecución del servicio | Media | 5 |
| HU-07 | Consultar historial de servicios | Media | 5 |
| HU-08 | Generar reporte por periodo | Baja | 5 |

## Estructura del repositorio

- `/docs`: documentación del proyecto (documento de trabajo de grado).
- `BITACORA.md`: bitácora de trabajo del equipo.

## Control de versiones

Se usa una rama por historia de usuario, con el formato `feature/HU-XX-nombre-corto`, trazable directamente con el Product Backlog.
