# Evidencia de sesión expirada — 2026-11-08

## Cambio

`src/api/http.ts` emite un evento de sesión expirada cuando una API protegida responde `401`. `AppContext` limpia el usuario autenticado, informa el motivo y permite que las rutas protegidas redirijan al login. El login fallido no dispara este evento para conservar su mensaje específico de credenciales.

## Prueba navegable

```text
npx playwright test -g "informa y redirige" --project=chromium
PASS — 1/1, 2,7 s
```

El caso inicia sesión, elimina la cookie desde el contexto del navegador, navega a otra sección protegida, verifica la redirección a `/login` y comprueba el mensaje `Tu sesión expiró`.

La prueba utiliza credenciales y datos ficticios de desarrollo; no representa un despliegue productivo.

