# Prueba de rendimiento RNF-03

Este directorio contiene el plan reproducible de Apache JMeter para las consultas de cotizaciones, historial operativo, reporte de periodo y comparaciÃ³n de planillas.

## Escenario configurado

- 10 usuarios concurrentes.
- 50 iteraciones por operaciÃ³n de consulta.
- AutenticaciÃ³n por cookie HttpOnly, realizada una vez por hilo.
- Datos ficticios separados del seed funcional mediante `500-registros.sql`.
- Variables de entorno de JMeter: `API_HOST`, `API_PORT`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CAMPO_ID` y `ADMIN_ID`.

El plan no inventa resultados. Antes de ejecutarlo se debe levantar PostgreSQL 16, aplicar el esquema y seeds de desarrollo, cargar el fixture y arrancar la API. Ejemplo:

```text
jmeter -n -t performance/dpm-api.jmx -JAPI_HOST=127.0.0.1 -JAPI_PORT=3000 -JADMIN_EMAIL=admin@dpm.example -JADMIN_PASSWORD=Admin123! -JCAMPO_ID=1 -JADMIN_ID=2 -l performance/results.jtl -e -o performance/report
```

Los archivos `results.jtl` y `report/` son artefactos generados y no deben versionarse. El promedio y P95 menores de 3 segundos solo se pueden declarar despuÃ©s de ejecutar la prueba y conservar el ambiente, fecha, versiÃ³n y resultados.

## Evidencia local disponible

La ejecuciÃ³n local se realizÃ³ el 2026-11-08 con Apache JMeter 5.6.3, PostgreSQL 16 aislado y la API compilada. El escenario produjo 2.010 muestras y 0 errores; los P95 por operaciÃ³n fueron 4 ms (cotizaciones), 4 ms (historial), 5 ms (reporte) y 4 ms (comparaciÃ³n). La evidencia estÃ¡ en `performance/evidencia-2026-11-08/`.

Para validar los artefactos ya generados sin repetir la carga, ejecuta `npm run test:performance`. Para un resultado concreto puedes pasar el `statistics.json` como segundo argumento: `npm run test:performance -- performance/evidencia-live-2026-11-08/statistics.json`. El verificador comprueba las 500 muestras por operaciÃ³n, los 2.010 registros totales, cero errores y el P95 menor de 3 segundos; no sustituye una nueva ejecuciÃ³n de JMeter.

Esta mediciÃ³n es reproducible y Ãºnicamente local, con datos ficticios; no constituye un SLA de producciÃ³n ni validaciÃ³n de DPM.

