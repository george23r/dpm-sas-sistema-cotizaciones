# Fase 1 — acceso y cliente HTTP

**Fecha:** 2026-11-08 (America/Bogota)  
**Estado:** preparada en frontend; integración E2E bloqueada por backend ausente.

## Archivos cambiados en esta fase

- `src/api/http.ts`: cliente HTTP tipado, `credentials: include`, manejo de respuestas no OK y errores 401.
- `src/api/auth.ts`: adaptadores para `POST /auth/login`, `GET /auth/me` y `POST /auth/logout`.
- `src/context/AppContext.tsx`: estado de sesión, usuario actual, carga inicial y errores; no usa `localStorage`.
- `src/components/shared/RutaProtegida.tsx`: estado de verificación de sesión y redirección por rol real recibido.
- `src/pages/Login.tsx`: envío asíncrono, validación, `role=alert`, bloqueo durante carga y mensaje 401.
- `src/components/layout/TopBar.tsx`: elimina el selector de rol para usuarios reales; solo lo muestra con `VITE_DEMO_MODE=true` y aviso permanente.
- `src/App.tsx`, `Sidebar.tsx`, `BottomNav.tsx`: tolerancia al estado inicial sin usuario autenticado.
- `.env.example`: documenta `VITE_API_URL` y el feature flag de demo sin secretos.

## Endpoints consumidos

El frontend quedó preparado para consumir, con cookies de sesión, los siguientes endpoints:

| Método | Ruta | Resultado en este repositorio |
|---|---|---|
| `POST` | `/api/v1/auth/login` | Cliente implementado; no verificable porque no existe backend local conectado al frontend. |
| `GET` | `/api/v1/auth/me` | Cliente implementado al cargar la aplicación; no verificable porque no existe backend local conectado al frontend. |
| `POST` | `/api/v1/auth/logout` | Cliente implementado; no verificable porque no existe backend local conectado al frontend. |

No se almacenan JWT ni credenciales en `localStorage`. La protección definitiva de permisos sigue dependiendo del servidor.

## Criterios comprobados

- El proyecto mantiene React + TypeScript + Vite y compila sin errores.
- El login ya no considera suficientes unos campos no vacíos cuando `VITE_DEMO_MODE` no está habilitado.
- El rol visible se obtiene del usuario autenticado; el selector de rol no aparece en modo real.
- Los errores de autenticación se exponen con texto y `aria-live`.
- Una recarga intenta recuperar la sesión con `/auth/me`.
- El cierre de sesión limpia el estado local aun si el servidor no responde.

## Comandos y resultados

| Comando | Resultado |
|---|---|
| `npm ci` | OK, código 0. |
| `npm run build` | OK, código 0. |
| `npm run lint` | OK, código 0; 5 advertencias existentes/de hooks. |
| `npm run test:unit` | BLOQUEADO: no existe el script ni la carpeta `tests/`. |

## Pendientes para cerrar la fase

1. Confirmar el contrato real de respuesta de `/auth/login` y `/auth/me` con el backend.
2. Configurar `VITE_API_URL` en un entorno de desarrollo conectado a Express/PostgreSQL.
3. Agregar pruebas de login, 401, sesión expirada, logout y permisos de rutas.
4. Verificar cookies HttpOnly y CSRF en coordinación con el backend.

La Fase 1 no se marca como Done: falta completar el flujo punta a punta contra API y PostgreSQL.
