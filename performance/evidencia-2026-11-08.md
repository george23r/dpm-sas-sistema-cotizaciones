# Evidencia RNF-03 — Apache JMeter

Fecha: 2026-11-08, America/Bogota  
Commit probado: `ecbe9ea`  
Entorno: Windows 11, Java 25.0.2, Apache JMeter 5.6.3, Docker PostgreSQL 16 (`dpm-jmeter-pg-20261108`), API Express compilada desde `backend/`.

## Escenario ejecutado

- 10 usuarios concurrentes con rampa de 10 segundos.
- Login una vez por hilo mediante cookie HttpOnly.
- 50 iteraciones para cada operación de consulta.
- Fixture ficticio `performance/500-registros.sql` aplicado en una base aislada.
- JTL completo: `performance/evidencia-2026-11-08/results.jtl`.
- Resumen generado por JMeter: `performance/evidencia-2026-11-08/statistics.json`.

Comando ejecutado:

```text
jmeter -n -t performance/dpm-api.jmx -JAPI_HOST=127.0.0.1 -JAPI_PORT=3000 -JADMIN_EMAIL=admin@dpm.example -JADMIN_PASSWORD=Admin123! -JCAMPO_ID=1 -JADMIN_ID=2 -l results.jtl
```

## Resultado observado

Los tiempos están en milisegundos.

| Operación | Muestras | Errores | Promedio | P95 | Máximo |
|---|---:|---:|---:|---:|---:|
| GET cotizaciones | 500 | 0 | 2,73 | 4 | 13 |
| GET historial operativo | 500 | 0 | 3,32 | 4 | 204 |
| GET reporte de periodo | 500 | 0 | 4,13 | 5 | 304 |
| GET comparación de planillas | 500 | 0 | 2,95 | 4 | 17 |
| Total de muestras | 2.010 | 0 | 4,72 | 4 | 369 |

El P95 de las cuatro operaciones evaluadas fue menor de 3 segundos en este ambiente aislado. Este resultado no constituye un SLA ni una validación de disponibilidad en producción; depende del hardware local, Docker, el volumen ficticio y la configuración usada.

## Limitaciones

- Se usaron datos ficticios y una base descartable de pruebas.
- No se midió frontend, red externa, despliegue gestionado ni disponibilidad.
- La prueba incluye 10 logins y 2.000 consultas; el login no se usa para evaluar el umbral de consultas.
- No se declara validación empresarial por parte de DPM.
