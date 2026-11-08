import assert from "node:assert/strict";
import { test } from "node:test";

const required = [
  "RUN_INTEGRATION",
  "DATABASE_URL",
  "CORS_ORIGIN",
  "SESSION_SECRET",
  "INTEGRATION_ADMIN_EMAIL",
  "INTEGRATION_ADMIN_PASSWORD",
  "INTEGRATION_CLIENT_EMAIL",
  "INTEGRATION_CLIENT_PASSWORD",
] as const;
const missing = required.filter((key) => !process.env[key]);
if (process.env.RUN_INTEGRATION !== "1") missing.push("RUN_INTEGRATION");

test("flujo integrado de cotización, orden y permisos", { skip: missing.length > 0 }, async () => {
  const { buildApp } = await import("../src/app.js");
  const { pool } = await import("../src/db/pool.js");
  const app = buildApp();
  const server = await new Promise<import("node:http").Server>((resolve) => {
    const instance = app.listen(0, () => resolve(instance));
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const base = `http://127.0.0.1:${address.port}`;

  try {
    async function request(path: string, init: RequestInit = {}, cookie?: string) {
      const headers = new Headers(init.headers);
      headers.set("Origin", process.env.CORS_ORIGIN!);
      if (cookie) headers.set("Cookie", cookie);
      if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      const response = await fetch(`${base}${path}`, { ...init, headers });
      const text = await response.text();
      let body: any = {};
      if (text) body = JSON.parse(text);
      return { response, body };
    }

    async function login(email: string, password: string) {
      const result = await request("/api/v1/auth/login", { method: "POST", body: JSON.stringify({ correo: email, clave: password }) });
      assert.equal(result.response.status, 200);
      const cookies = result.response.headers.getSetCookie?.() ?? [];
      const cookie = cookies[0]?.split(";", 1)[0];
      assert.ok(cookie, "El login debe entregar una cookie de sesión");
      return { cookie, user: result.body.user };
    }

    const admin = await login(process.env.INTEGRATION_ADMIN_EMAIL!, process.env.INTEGRATION_ADMIN_PASSWORD!);
    const me = await request("/api/v1/auth/me", {}, admin.cookie);
    assert.equal(me.response.status, 200);
    assert.equal(me.body.user.rol, "administrador");

    const client = await login(process.env.INTEGRATION_CLIENT_EMAIL!, process.env.INTEGRATION_CLIENT_PASSWORD!);
    const zones = await request("/api/v1/zonas", {}, client.cookie);
    assert.equal(zones.response.status, 200);
    const zone = zones.body.data[0];
    assert.ok(zone?.id, "El cliente de integración debe tener una zona");

    const created = await request("/api/v1/cotizaciones", { method: "POST", body: JSON.stringify({ zonaId: zone.id, objeto: `Integración automatizada ${Date.now()}`, alcance: "Prueba de flujo persistente" }) }, client.cookie);
    assert.equal(created.response.status, 201);
    const quoteId = created.body.data.id;

    const forbiddenCatalog = await request("/api/v1/clientes", {}, client.cookie);
    assert.equal(forbiddenCatalog.response.status, 403);

    const visit = await request(`/api/v1/cotizaciones/${quoteId}/visitas`, { method: "POST", body: JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), observaciones: "Visita de prueba" }) }, admin.cookie);
    assert.equal(visit.response.status, 201);
    const line = await request(`/api/v1/cotizaciones/${quoteId}/lineas`, { method: "POST", body: JSON.stringify({ concepto: "Mantenimiento de prueba", cantidad: 1, valorUnitario: 100000 }) }, admin.cookie);
    assert.equal(line.response.status, 201);
    const cost = await request(`/api/v1/cotizaciones/${quoteId}/costos`, { method: "POST", body: JSON.stringify({ tipo: "mano_obra", descripcion: "Costo interno de prueba", cantidad: 1, valorUnitario: 50000 }) }, admin.cookie);
    assert.equal(cost.response.status, 201);
    const milestone = await request(`/api/v1/cotizaciones/${quoteId}/hitos`, { method: "POST", body: JSON.stringify({ orden: 1, descripcion: "Pago total", porcentaje: 100 }) }, admin.cookie);
    assert.equal(milestone.response.status, 201);
    const sent = await request(`/api/v1/cotizaciones/${quoteId}/enviar`, { method: "POST" }, admin.cookie);
    assert.equal(sent.response.status, 200);

    const clientQuote = await request(`/api/v1/cotizaciones/${quoteId}`, {}, client.cookie);
    assert.equal(clientQuote.response.status, 200);
    assert.equal(clientQuote.body.data.estado, "enviada");
    assert.equal("costos" in clientQuote.body.data, false, "El cliente no debe recibir costos internos");
    const answered = await request(`/api/v1/cotizaciones/${quoteId}/respuesta`, { method: "POST", body: JSON.stringify({ acepta: true }) }, client.cookie);
    assert.equal(answered.response.status, 200);

    const crews = await request("/api/v1/cuadrillas", {}, admin.cookie);
    assert.equal(crews.response.status, 200);
    const start = new Date("2026-12-20T13:00:00-05:00");
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const order = await request("/api/v1/ordenes", { method: "POST", body: JSON.stringify({ cotizacionId: quoteId, cuadrillaId: crews.body.data[0]?.id ?? null, inicio: start.toISOString(), fin: end.toISOString() }) }, admin.cookie);
    assert.equal(order.response.status, 201);

    const operatorEmail = process.env.INTEGRATION_OPERATOR_EMAIL;
    const operatorPassword = process.env.INTEGRATION_OPERATOR_PASSWORD;
    if (operatorEmail && operatorPassword) {
      const operator = await login(operatorEmail, operatorPassword);
      const mine = await request("/api/v1/ordenes/mias", {}, operator.cookie);
      assert.equal(mine.response.status, 200);
      assert.ok(mine.body.data.some((item: { id: number }) => item.id === order.body.data.id));
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await pool.end();
  }
});
