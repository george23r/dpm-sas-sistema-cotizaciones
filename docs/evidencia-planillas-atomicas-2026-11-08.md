# Evidencia de creaciÃ³n atÃ³mica de planillas â€” 2026-11-08

## Cambio

Se aÃ±adiÃ³ `POST /api/v1/planillas/par`. El endpoint crea en una sola transacciÃ³n la planilla de campo y la administrativa para el mismo cliente y periodo. Si existe una de las dos o falla una validaciÃ³n, la transacciÃ³n se revierte; los endpoints individuales se conservan para compatibilidad.

La vista API de jornadas usa ahora este endpoint mediante `crearParPlanillasApi`, evitando dejar periodos incompletos por dos solicitudes independientes.

## Pruebas

Comandos ejecutados desde `backend/`:

```powershell
npm run build
npm run lint
npm test
$env:RUN_INTEGRATION='1'; $env:DATABASE_URL='postgresql://dpm_api:dpm_api_dev@localhost:5432/dpm_sas'; $env:CORS_ORIGIN='http://localhost:5173'; $env:SESSION_SECRET='local-integration-secret-01234567890123456789'; $env:INTEGRATION_ADMIN_EMAIL='admin@dpm.example'; $env:INTEGRATION_ADMIN_PASSWORD='Admin123!'; $env:INTEGRATION_CLIENT_EMAIL='hacienda@cliente.example'; $env:INTEGRATION_CLIENT_PASSWORD='Cliente123!'; $env:INTEGRATION_OPERATOR_EMAIL='luis.gomez@dpm.example'; $env:INTEGRATION_OPERATOR_PASSWORD='Operario123!'; npm run test:integration
```

Resultados reales:

- Build: PASS.
- Lint: PASS.
- Unitarias: 5 PASS, 1 omitida sin integraciÃ³n.
- IntegraciÃ³n con PostgreSQL local de desarrollo: `1 passed, 0 failed, 0 skipped`.

La base y las credenciales usadas son ficticias y locales; no representan producciÃ³n ni validaciÃ³n de reglas empresariales por DPM.


