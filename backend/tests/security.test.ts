import assert from "node:assert/strict";
import test from "node:test";
import { requireSameOrigin } from "../src/middlewares/auth.js";

process.env.DATABASE_URL ??= "postgresql://test:test@localhost:5432/test";
process.env.CORS_ORIGIN ??= "http://localhost:5173";
process.env.SESSION_SECRET ??= "test-session-secret-with-at-least-32-chars";
const allowedOrigin = process.env.CORS_ORIGIN;

function request(headers: Record<string, string>, method = "GET") {
  return { method, get: (name: string) => headers[name.toLowerCase()] } as never;
}

test("rechaza un origen parecido al permitido", () => {
  let error: unknown;
  requireSameOrigin(request({ origin: `${allowedOrigin}.evil` }), {} as never, (value) => { error = value; });
  assert.equal((error as { code: string }).code, "CSRF_ORIGIN_REJECTED");
});

test("acepta un referer del origen permitido usando solo su origin", () => {
  let error: unknown;
  requireSameOrigin(request({ referer: `${allowedOrigin}/app/admin/panel` }), {} as never, (value) => { error = value; });
  assert.equal(error, undefined);
});

test("rechaza una mutación sin origin ni referer", () => {
  let error: unknown;
  requireSameOrigin(request({}, "POST"), {} as never, (value) => { error = value; });
  assert.equal((error as { code: string }).code, "CSRF_ORIGIN_MISSING");
});
