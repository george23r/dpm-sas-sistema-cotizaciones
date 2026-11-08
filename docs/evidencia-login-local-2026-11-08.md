# Evidencia de inicio de sesión local

Fecha: 2026-11-08  
Entorno: PostgreSQL 16 Docker (`dpm-postgres`), Express en `3000` y Vite en `5173`.

## Causa encontrada

La base local tenía el seed general `database/02_seed.sql`, cuyos `password_hash` son marcadores no autenticables. El workflow E2E ya aplicaba `database/04_seed_e2e.sql`, pero la guía local no dejaba explícita esa aplicación.

Además, el frontend no tenía `VITE_API_URL` local ni proxy de desarrollo, por lo que una solicitud relativa a `/api/v1` terminaba en Vite en lugar de Express.

## Correcciones

- `vite.config.ts` incorpora proxy de desarrollo `/api` hacia `http://localhost:3000`.
- Se aplicó `database/04_seed_e2e.sql` únicamente sobre la base Docker local de desarrollo. El archivo solo actualiza hashes ficticios y no contiene credenciales productivas.
- Se verificó que el login del operario respondiera `200` y devolviera únicamente `id`, `nombre`, `correo` y `rol`.

## Prueba reproducible

```text
Get-Content database/04_seed_e2e.sql | docker exec -i dpm-postgres psql -U postgres -d dpm_sas -v ON_ERROR_STOP=1
$env:E2E_BASE_URL='http://localhost:5173'
npx playwright test
```

Resultado real: `12 passed (36.3s)` en Chromium, Firefox y WebKit; incluye panel administrativo, portal cliente, portal operario y recorrido de teclado del login.

La base usada es ficticia y local. Esto no constituye una configuración de producción ni una validación empresarial de credenciales.
