# Evidencia de protección de origen — 2026-11-08

## Cambio

El middleware `backend/src/middlewares/auth.ts` compara el `Origin` o el origen del `Referer` mediante igualdad exacta con `CORS_ORIGIN`. Desde esta fecha, una mutación (`POST`, `PUT`, `PATCH` o `DELETE`) sin ninguno de esos encabezados se rechaza con `403 CSRF_ORIGIN_MISSING`.

Esto complementa la cookie de sesión `HttpOnly`; no sustituye la configuración segura de HTTPS, `Secure` y `SameSite` en el despliegue.

## Pruebas ejecutadas

Desde `backend/`:

```text
npm run build       PASS
npm run lint        PASS
npm test            PASS — 5 pruebas, 1 integración omitida sin RUN_INTEGRATION
```

La prueba unitaria añadida verifica el rechazo de una mutación sin `Origin` ni `Referer`. También se ejecutó la integración con PostgreSQL local y credenciales ficticias del entorno de pruebas:

```text
npm run test:integration  PASS — 1 flujo integrado, 0 fallos, 0 omitidos
```

La integración también desactivó la cuenta administrativa después del login y verificó que una solicitud posterior con la cookie existente recibe `401 SESSION_REVOKED`; el rol y el estado activo se refrescan desde PostgreSQL en cada solicitud autenticada.

## Alcance de la evidencia

La verificación se realizó en una base PostgreSQL local de pruebas. No demuestra un despliegue productivo ni una revisión legal de cumplimiento.

