# Evidencia de gates de CI

Fecha: 2026-11-08

Se actualizaron los workflows para que los gates reflejen la meta tecnica:

- `validar-prototipo.yml` ejecuta build, lint y pruebas unitarias del frontend.
- `validar-backend.yml` prepara PostgreSQL 16, ejecuta esquema, seed, las 27 comprobaciones SQL, build, lint, pruebas unitarias y la integracion HTTP contra PostgreSQL con credenciales ficticias.
- `validar-e2e.yml` conserva el flujo de navegador con PostgreSQL temporal y los tres motores Playwright.

Verificacion local de los comandos afectados:

- Frontend lint: PASS con advertencias existentes.
- Frontend build: PASS.
- Frontend unitarias: 15/15 PASS.
- Backend build: PASS.
- Backend lint: PASS.
- Backend unitarias: 4 PASS, 1 SKIP opt-in.
- Backend integracion local: 1 PASS, 0 FAIL, 0 SKIP.

La ejecucion de GitHub Actions no se declara PASS desde esta maquina; los workflows quedan preparados para que el proveedor registre el resultado real.
