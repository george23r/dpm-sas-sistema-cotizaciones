# Evidencia RBAC del catálogo de zonas — 2026-11-08

## Hallazgo

La auditoría del backend detectó que `GET /api/v1/zonas` requería una sesión, pero no restringía el rol. Un operario podía consultar zonas de clientes que no pertenecían a su cuadrilla.

## Corrección

El endpoint ahora exige rol `administrador` o `cliente` en el servidor. El cliente continúa limitado por la relación `usuarios → clientes`; el administrador consulta el catálogo administrativo. El operario recibe `403 FORBIDDEN` y no obtiene datos de zonas.

## Prueba reproducible

Ejecutada contra PostgreSQL 16 temporal con datos ficticios:

```text
RUN_INTEGRATION=1 npm run test:integration
flujo integrado de cotización, orden y permisos: PASS
1 passed, 0 failed, 0 skipped
```

La regresión verifica explícitamente:

```text
GET /api/v1/zonas con cookie de operario → 403 FORBIDDEN
```

Commit: `3242a14 fix: restrict zones catalog by role`.

La base utilizada es únicamente de desarrollo/pruebas; no se declara validación empresarial ni despliegue productivo.

