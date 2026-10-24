# Persistencia PostgreSQL — Corte 2

Contiene la evidencia técnica de diseño y construcción de la persistencia del sistema DPM S.A.S.

| Archivo | Propósito |
| --- | --- |
| `01_schema.sql` | Esquema `dpm`: 12 tablas, índices, validaciones, funciones, vistas, triggers y permisos |
| `02_seed.sql` | Datos de prueba ficticios y parámetros de tarifas ilustrativos |
| `03_consultas_comprobacion.sql` | Pruebas de requisitos y consultas de validación |
| `diccionario_datos.md` | Diccionario de datos de tablas y columnas |
| [`diagrama_er.md`](diagrama_er.md) | Diagrama entidad-relación en Mermaid, basado en las 12 tablas del esquema PostgreSQL |
| `prueba_salida.txt` | Registro de ejecución de pruebas compartido por el equipo |

## Reconstrucción en PostgreSQL 14+

```bash
createdb dpm_sas
psql -d dpm_sas -v ON_ERROR_STOP=1 -f database/01_schema.sql
psql -d dpm_sas -v ON_ERROR_STOP=1 -f database/02_seed.sql
psql -d dpm_sas -v ON_ERROR_STOP=1 -f database/03_consultas_comprobacion.sql
```

**Atención:** el script de esquema contiene `DROP SCHEMA IF EXISTS dpm CASCADE`; usar solo en base de desarrollo y sin datos reales. Las tarifas del seed no reflejan valores confirmados de la empresa.

> La imagen original `diagrama_er.png` no se ha incorporado al repositorio. El diagrama Mermaid enlazado arriba permite consultar las relaciones directamente en GitHub. La representación original puede añadirse como archivo complementario después.

La evidencia de ejecución está en `prueba_salida.txt`; para reproducibilidad debe ejecutarse en una instancia propia. Ver [arquitectura](../docs/arquitectura/arquitectura-sistema.md).
