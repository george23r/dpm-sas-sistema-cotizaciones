# Arquitectura del sistema â€” DPM S.A.S.

Estado actualizado: 2026-11-08. Este documento describe el software existente y separa lo implementado y probado de lo que aÃºn no estÃ¡ desplegado o validado por DPM.

## 1. Estado real

| Componente | Estado verificable |
|---|---|
| AplicaciÃ³n web | React + TypeScript + Vite + Tailwind; portales de administrador, cliente y operario; datos API en modo normal y semillas solo con `VITE_DEMO_MODE=true`. |
| API REST | Node.js + Express + TypeScript; mÃ³dulos de autenticaciÃ³n, catÃ¡logos, cotizaciones, Ã³rdenes, cuadrillas, planillas y reportes. |
| Persistencia | PostgreSQL 16 mediante `pg`, consultas parametrizadas y transacciones donde aplica. |
| AutenticaciÃ³n | SesiÃ³n firmada en cookie HttpOnly, `GET /auth/me`, cierre de sesiÃ³n, expiraciÃ³n y autorizaciÃ³n por rol/propiedad. No se usa JWT en `localStorage`. |
| Reglas crÃ­ticas | Validaciones en API y PostgreSQL para cotizaciones, vigencia, hitos, zonas, solapes, Ã³rdenes y conciliaciÃ³n. |
| CI y pruebas | Workflows para frontend, backend/SQL e integraciÃ³n E2E; pruebas locales documentadas con datos ficticios. |
| Despliegue | No realizado en Vercel, Render ni PostgreSQL gestionado; no se declara disponibilidad ni SLA. |

## 2. Capas

```text
React/Vite/Tailwind
        â”‚  HTTP + cookie HttpOnly
        â–¼
Express/TypeScript
  middleware â†’ mÃ³dulos â†’ repositorios SQL parametrizados
        â”‚
        â–¼
PostgreSQL 16 / esquema dpm
  tablas, vistas, funciones, procedimientos, triggers y roles de BD
```

El frontend usa `src/api/` para adaptar DTO de la API a los modelos de UI. `src/context/AppContext.tsx` conserva datos y reglas Ãºnicamente para el modo demo; los mÃ³dulos API no lo utilizan como fuente de verdad.

## 3. Seguridad y autorizaciÃ³n

- `POST /api/v1/auth/login`, `GET /api/v1/auth/me` y `POST /api/v1/auth/logout` usan cookie de sesiÃ³n HttpOnly.
- El servidor aplica `authenticate` y `requireRole(...)`; ocultar una opciÃ³n en React no es el mecanismo de seguridad.
- Clientes, zonas, cotizaciones, Ã³rdenes e historial verifican propiedad o membresÃ­a de cuadrilla en el servidor.
- Las consultas se parametrizan; se usan Helmet, CORS por origen explÃ­cito y lÃ­mite de intentos de login.
- `dpm_reportes` y `dpm_app` son roles de base de datos distintos de `rol_usuario`.
- No se almacenan contraseÃ±as en texto plano ni tokens persistentes en el navegador.

## 4. Flujo de cotizaciÃ³n y operaciÃ³n

1. El cliente registra una solicitud para una zona propia.
2. AdministraciÃ³n registra visita, lÃ­neas, costos internos y hitos.
3. PostgreSQL valida visita, lÃ­neas y suma de hitos; la cotizaciÃ³n enviada queda inmutable.
4. El cliente acepta o rechaza una cotizaciÃ³n enviada y vigente.
5. AdministraciÃ³n crea una orden desde una cotizaciÃ³n aceptada; la base bloquea doble programaciÃ³n y solapes de cuadrilla.
6. El operario consulta Ãºnicamente las Ã³rdenes de su cuadrilla, inicia y finaliza el servicio con nota opcional.
7. AdministraciÃ³n registra planillas, compara campo/administraciÃ³n y concilia solo si no hay diferencias.

## 5. Requisitos no funcionales

| RNF | Evidencia o condiciÃ³n |
|---|---|
| RNF-01 | UI responsive y capturas en Chromium, Firefox y WebKit; auditorÃ­a WCAG completa aÃºn pendiente. |
| RNF-02 | Hash bcrypt en usuarios de prueba, cookies HttpOnly, Helmet y CORS estricto; HTTPS depende del despliegue. |
| RNF-03 | JMeter local con 2.010 muestras, 0 errores y P95 de 4â€“5 ms en consultas seleccionadas; no es SLA productivo. |
| RNF-04 | RBAC API, comprobaciÃ³n de propiedad y roles de BD; pruebas negativas de acceso cruzado. |

## 6. LÃ­mites y pendientes

- Tarifas, unidades definitivas, recargos, permisos empresariales y protocolos de conciliaciÃ³n requieren validaciÃ³n de DPM.
- El catÃ¡logo no presenta tarifas ficticias en producciÃ³n.
- No se implementan facturaciÃ³n electrÃ³nica, nÃ³mina, pagos, correo/WhatsApp/SMS, geolocalizaciÃ³n ni biometrÃ­a.
- Registro libre de clientes permanece deshabilitado por feature flag.
- Falta desplegar y verificar infraestructura real, backups, HTTPS y secretos de producciÃ³n.

Los datos de seed y credenciales E2E son ficticios y solo sirven para desarrollo/CI.

