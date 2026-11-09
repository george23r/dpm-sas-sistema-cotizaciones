import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const openapiPath = fileURLToPath(new URL("../openapi.yaml", import.meta.url));
const document = readFileSync(openapiPath, "utf8");

test("OpenAPI declara detalle y asignación de órdenes consumidos por el frontend", () => {
  assert.match(document, /^  \/api\/v1\/ordenes\/\{id\}:$/m);
  assert.match(document, /operationId: getOrder/);
  assert.match(document, /operationId: updateOrderAssignment/);
  assert.match(document, /required: \[cuadrillaId\]/);
});

test("OpenAPI conserva las rutas de los módulos integrados", () => {
  const paths = [
    "/api/v1/auth/login", "/api/v1/auth/me", "/api/v1/auth/logout",
    "/api/v1/cotizaciones", "/api/v1/cotizaciones/{id}", "/api/v1/cotizaciones/{id}/visitas",
    "/api/v1/cotizaciones/{id}/lineas", "/api/v1/cotizaciones/{id}/costos", "/api/v1/cotizaciones/{id}/hitos",
    "/api/v1/cotizaciones/{id}/enviar", "/api/v1/cotizaciones/{id}/respuesta",
    "/api/v1/ordenes", "/api/v1/ordenes/mias", "/api/v1/ordenes/{id}", "/api/v1/ordenes/{id}/iniciar", "/api/v1/ordenes/{id}/finalizar",
    "/api/v1/cuadrillas", "/api/v1/cuadrillas/{id}", "/api/v1/cuadrillas/{id}/miembros",
    "/api/v1/planillas", "/api/v1/planillas/par", "/api/v1/planillas/comparar", "/api/v1/planillas/{id}/registros", "/api/v1/planillas/conciliar",
    "/api/v1/reportes/periodo", "/api/v1/reportes/resumen", "/api/v1/clientes", "/api/v1/clientes/{id}", "/api/v1/zonas", "/api/v1/zonas/{id}",
    "/api/v1/servicios", "/api/v1/servicios/{id}", "/api/v1/operarios", "/api/v1/operarios/{id}", "/api/v1/clientes/{id}/historial",
  ];
  for (const path of paths) assert.match(document, new RegExp(`^  ${path.replaceAll("{", "\\{").replaceAll("}", "\\}")}:$`, "m"), `Falta la ruta ${path}`);
});
