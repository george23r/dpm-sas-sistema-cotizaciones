# Prueba de rendimiento RNF-03

Este directorio contiene el plan reproducible de Apache JMeter para las consultas de cotizaciones, historial operativo, reporte de periodo y comparación de planillas.

## Escenario configurado

- 10 usuarios concurrentes.
- 50 iteraciones por operación de consulta.
- Autenticación por cookie HttpOnly, realizada una vez por hilo.
- Datos ficticios separados del seed funcional mediante `500-registros.sql`.
- Variables de entorno de JMeter: `API_HOST`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CAMPO_ID` y `ADMIN_ID`.

El plan no inventa resultados. Antes de ejecutarlo se debe levantar PostgreSQL 16, aplicar el esquema y seeds de desarrollo, cargar el fixture y arrancar la API. Ejemplo:

```text
jmeter -n -t performance/dpm-api.jmx -JAPI_HOST=http://127.0.0.1:3000 -JADMIN_EMAIL=admin@dpm.example -JADMIN_PASSWORD=Admin123! -JCAMPO_ID=1 -JADMIN_ID=2 -l performance/results.jtl -e -o performance/report
```

Los archivos `results.jtl` y `report/` son artefactos generados y no deben versionarse. El promedio y P95 menores de 3 segundos solo se pueden declarar después de ejecutar la prueba y conservar el ambiente, fecha, versión y resultados.

## Limitaciones actuales

La ejecución de JMeter no se ha realizado en este equipo. No se declara PASS para RNF-03 hasta disponer de Apache JMeter, PostgreSQL cargado con el fixture y evidencia JTL/HTML.
