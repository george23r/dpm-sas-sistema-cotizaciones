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
