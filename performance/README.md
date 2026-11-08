# Prueba de rendimiento RNF-03

Este directorio contiene el plan reproducible de Apache JMeter para las consultas de cotizaciones, historial operativo, reporte de periodo y comparación de planillas.

## Escenario configurado

- 10 usuarios concurrentes.
- 50 iteraciones por operación de consulta.
- Autenticación por cookie HttpOnly, realizada una vez por hilo.
- Datos ficticios separados del seed funcional mediante `500-registros.sql`.
- Variables de entorno de JMeter: `API_HOST`, `API_PORT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CAMPO_ID` y `ADMIN_ID`.

El plan no inventa resultados. Antes de ejecutarlo se debe levantar PostgreSQL 16, aplicar el esquema y seeds de desarrollo, cargar el fixture y arrancar la API. Ejemplo:

```text
jmeter -n -t performance/dpm-api.jmx -JAPI_HOST=127.0.0.1 -JAPI_PORT=3000 -JADMIN_EMAIL=admin@dpm.example -JADMIN_PASSWORD=Admin123! -JCAMPO_ID=1 -JADMIN_ID=2 -l performance/results.jtl -e -o performance/report
```

Los archivos `results.jtl` y `report/` son artefactos generados y no deben versionarse. El promedio y P95 menores de 3 segundos solo se pueden declarar después de ejecutar la prueba y conservar el ambiente, fecha, versión y resultados.

## Evidencia local disponible

La ejecución local se realizó el 2026-11-08 con Apache JMeter 5.6.3, PostgreSQL 16 aislado y la API compilada. El escenario produjo 2.010 muestras y 0 errores; los P95 por operación fueron 4 ms (cotizaciones), 4 ms (historial), 5 ms (reporte) y 4 ms (comparación). La evidencia está en `performance/evidencia-2026-11-08/`.

Esta medición es reproducible y únicamente local, con datos ficticios; no constituye un SLA de producción ni validación de DPM.
