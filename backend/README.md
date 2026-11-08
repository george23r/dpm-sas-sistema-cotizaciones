# API DPM S.A.S.

Backend Node.js + Express + TypeScript para la integración gradual del frontend React con PostgreSQL. Esta primera fase implementa únicamente infraestructura, salud de servicio y autenticación contra `dpm.usuarios`.

## Desarrollo local

1. Instala PostgreSQL 16 o inicia una base dedicada de desarrollo.
2. Copia `.env.example` a `.env` y define una `DATABASE_URL` real. No uses la cuenta superusuario para la API.
3. En una base desechable, aplica el esquema y seed ficticios:

```bash
psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f ../database/01_schema.sql
psql -v ON_ERROR_STOP=1 "$DATABASE_URL" -f ../database/02_seed.sql
```

`01_schema.sql` borra y recrea `dpm`; nunca lo ejecutes sobre producción. Los hashes de `02_seed.sql` son marcadores y no permiten iniciar sesión como usuarios reales.

```bash
npm ci
npm run build
npm test
npm run lint
npm start
```

## Rutas implementadas

- `GET /health`: respuesta pública mínima sin detalles internos.
- `GET /ready`: requiere sesión y comprueba la conexión a PostgreSQL.
- `POST /api/v1/auth/login`: valida correo/clave y crea cookie HttpOnly.
- `GET /api/v1/auth/me`: valida cookie, consulta de nuevo `dpm.usuarios` y devuelve el usuario actual.
- `POST /api/v1/auth/logout`: limpia la cookie.

La cookie no se expone al navegador mediante JavaScript. En producción se requiere HTTPS, `COOKIE_SAMESITE=none` únicamente cuando la separación de orígenes lo exija y `DB_SSL=true` con certificado verificable. El backend nunca devuelve `password_hash`.

## Estado de alcance

Las rutas de cotización por líneas, visitas, costos/hitos, planillas/conciliación y catálogo no se implementan todavía porque no existen sus tablas ni procedimientos en el SQL real de Corte 2. Requieren una migración SQL incremental, pruebas de regresión y validación de alcance antes de agregarse.
