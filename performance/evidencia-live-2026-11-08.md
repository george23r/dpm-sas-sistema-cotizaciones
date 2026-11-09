# Evidencia RNF-03 â€” ejecuciÃ³n nueva de JMeter

Fecha: 2026-11-08, America/Bogota  
Entorno: Windows 11, Java 25.0.2, Apache JMeter 5.6.3, API Express local y PostgreSQL 16 temporal `dpm_codex_test_20261108`.

## Escenario

- 10 usuarios concurrentes con rampa de 10 segundos.
- Login una vez por hilo mediante cookie HttpOnly.
- 50 iteraciones de cada una de las cuatro consultas.
- 2.010 muestras totales: 10 logins + 2.000 consultas.
- Datos ficticios y base temporal; no es una mediciÃ³n de producciÃ³n.
- El plan JMeter envÃ­a `Origin: http://127.0.0.1:5173` en el login para cumplir la protecciÃ³n CSRF de la API.

Comando ejecutado:

```text
C:\jmeter-5.6.3\bin\jmeter.bat -n -t performance\dpm-api.jmx -JAPI_HOST=127.0.0.1 -JAPI_PORT=3000 -JADMIN_EMAIL=admin@dpm.example -JADMIN_PASSWORD=*** -JCAMPO_ID=1 -JADMIN_ID=2 -l performance\evidencia-live-2026-11-08\results-host-3.jtl -e -o <directorio-temporal>
```

## Resultado real

| OperaciÃ³n | Muestras | Errores | Promedio (ms) | P95 (ms) | MÃ¡ximo (ms) |
|---|---:|---:|---:|---:|---:|
| `GET cotizaciones` | 500 | 0 | 6,67 | 8 | 287 |
| `GET historial servicios finalizados` | 500 | 0 | 4,39 | 6 | 280 |
| `GET reporte de periodo` | 500 | 0 | 4,91 | 6 | 208 |
| `GET comparaciÃ³n de planillas` | 500 | 0 | 6,81 | 7 | 309 |
| Total | 2.010 | 0 | 7,12 | 7 | 360 |

La ejecuciÃ³n terminÃ³ con cÃ³digo 0 y 0 errores. El P95 de las cuatro consultas fue menor de 3 segundos en este ambiente aislado. Los artefactos son `results-host-3.jtl` y `statistics.json` en este directorio.

## VerificaciÃ³n reproducible

```text
npm run test:performance -- performance/evidencia-live-2026-11-08/statistics.json
```

Resultado: `PASS: 4 operaciones, 2.000 consultas, P95 < 3 s y 0 errores.`

## Limitaciones

El resultado depende del equipo local, Docker, red local y volumen ficticio. No constituye SLA, disponibilidad de producciÃ³n ni validaciÃ³n empresarial de DPM.

