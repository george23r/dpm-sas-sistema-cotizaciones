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
  "INTEGRATION_OPERATOR_EMAIL",
  "INTEGRATION_OPERATOR_PASSWORD",
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

    const managedClient = await request("/api/v1/clientes", { method: "POST", body: JSON.stringify({ nombre: `Cliente CRUD ${Date.now()}`, tipo: "comercial", nit: `TEST-${Date.now()}` }) }, admin.cookie);
    assert.equal(managedClient.response.status, 201);
    const managedZone = await request("/api/v1/zonas", { method: "POST", body: JSON.stringify({ clienteId: managedClient.body.data.id, nombre: "Zona principal", direccion: "Dirección de prueba", areaM2: 120 }) }, admin.cookie);
    assert.equal(managedZone.response.status, 201);
    const updatedZone = await request(`/api/v1/zonas/${managedZone.body.data.id}`, { method: "PATCH", body: JSON.stringify({ descripcion: "Zona actualizada" }) }, admin.cookie);
    assert.equal(updatedZone.response.status, 200);
    const managedTeam = await request("/api/v1/cuadrillas", { method: "POST", body: JSON.stringify({ nombre: `Cuadrilla CRUD ${Date.now()}` }) }, admin.cookie);
    assert.equal(managedTeam.response.status, 201);
    const managedWorker = await request("/api/v1/operarios", { method: "POST", body: JSON.stringify({ nombre: "Operario CRUD", cuadrillaId: managedTeam.body.data.id, esLider: true, activo: true }) }, admin.cookie);
    assert.equal(managedWorker.response.status, 201);
    const duplicateLeader = await request("/api/v1/operarios", { method: "POST", body: JSON.stringify({ nombre: "Segundo líder", cuadrillaId: managedTeam.body.data.id, esLider: true, activo: true }) }, admin.cookie);
    assert.equal(duplicateLeader.response.status, 409);
    const updatedWorker = await request(`/api/v1/operarios/${managedWorker.body.data.id}`, { method: "PATCH", body: JSON.stringify({ activo: false }) }, admin.cookie);
    assert.equal(updatedWorker.response.status, 200);

    const client = await login(process.env.INTEGRATION_CLIENT_EMAIL!, process.env.INTEGRATION_CLIENT_PASSWORD!);
    const zones = await request("/api/v1/zonas", {}, client.cookie);
    assert.equal(zones.response.status, 200);
    const zone = zones.body.data[0];
    const ownHistory = await request(`/api/v1/clientes/${zone.cliente_id}/historial`, {}, client.cookie);
    assert.equal(ownHistory.response.status, 200);
    assert.ok(zone?.id, "El cliente de integración debe tener una zona");

    const foreignQuote = await request("/api/v1/cotizaciones", { method: "POST", body: JSON.stringify({ zonaId: managedZone.body.data.id, objeto: "Zona ajena de prueba" }) }, client.cookie);
    assert.equal(foreignQuote.response.status, 403);
    assert.equal(foreignQuote.body.code, "ZONE_NOT_OWNED");

    const created = await request("/api/v1/cotizaciones", { method: "POST", body: JSON.stringify({ zonaId: zone.id, objeto: `Integración automatizada ${Date.now()}`, alcance: "Prueba de flujo persistente" }) }, client.cookie);
    assert.equal(created.response.status, 201);
    const quoteId = created.body.data.id;

    const incompleteSend = await request(`/api/v1/cotizaciones/${quoteId}/enviar`, { method: "POST" }, admin.cookie);
    assert.equal(incompleteSend.response.status, 409);
    assert.equal(incompleteSend.body.code, "QUOTE_SEND_BLOCKED");

    const forbiddenCatalog = await request("/api/v1/clientes", {}, client.cookie);
    assert.equal(forbiddenCatalog.response.status, 403);

    const visit = await request(`/api/v1/cotizaciones/${quoteId}/visitas`, { method: "POST", body: JSON.stringify({ fecha: new Date().toISOString().slice(0, 10), observaciones: "Visita de prueba" }) }, admin.cookie);
    assert.equal(visit.response.status, 201);
    const line = await request(`/api/v1/cotizaciones/${quoteId}/lineas`, { method: "POST", body: JSON.stringify({ concepto: "Mantenimiento de prueba", cantidad: 1, valorUnitario: 100000 }) }, admin.cookie);
    assert.equal(line.response.status, 201);
    const cost = await request(`/api/v1/cotizaciones/${quoteId}/costos`, { method: "POST", body: JSON.stringify({ tipo: "mano_obra", descripcion: "Costo interno de prueba", cantidad: 1, valorUnitario: 50000 }) }, admin.cookie);
    assert.equal(cost.response.status, 201);
    const firstMilestone = await request(`/api/v1/cotizaciones/${quoteId}/hitos`, { method: "POST", body: JSON.stringify({ orden: 1, descripcion: "Anticipo", porcentaje: 50 }) }, admin.cookie);
    assert.equal(firstMilestone.response.status, 201);
    const incompleteMilestones = await request(`/api/v1/cotizaciones/${quoteId}/enviar`, { method: "POST" }, admin.cookie);
    assert.equal(incompleteMilestones.response.status, 409);
    assert.equal(incompleteMilestones.body.code, "QUOTE_SEND_BLOCKED");
    const milestone = await request(`/api/v1/cotizaciones/${quoteId}/hitos`, { method: "POST", body: JSON.stringify({ orden: 2, descripcion: "Saldo", porcentaje: 50 }) }, admin.cookie);
    assert.equal(milestone.response.status, 201);
    const sent = await request(`/api/v1/cotizaciones/${quoteId}/enviar`, { method: "POST" }, admin.cookie);
    assert.equal(sent.response.status, 200);
    const immutableLine = await request(`/api/v1/cotizaciones/${quoteId}/lineas`, { method: "POST", body: JSON.stringify({ concepto: "Cambio posterior", cantidad: 1, valorUnitario: 1 }) }, admin.cookie);
    assert.equal(immutableLine.response.status, 409);
    assert.equal(immutableLine.body.code, "QUOTE_IMMUTABLE");

    const clientQuote = await request(`/api/v1/cotizaciones/${quoteId}`, {}, client.cookie);
    assert.equal(clientQuote.response.status, 200);
    assert.equal(clientQuote.body.data.estado, "enviada");
    assert.equal("costos" in clientQuote.body.data, false, "El cliente no debe recibir costos internos");
    const answered = await request(`/api/v1/cotizaciones/${quoteId}/respuesta`, { method: "POST", body: JSON.stringify({ acepta: true }) }, client.cookie);
    assert.equal(answered.response.status, 200);

    const crews = await request("/api/v1/cuadrillas", {}, admin.cookie);
    assert.equal(crews.response.status, 200);
    const operator = await login(process.env.INTEGRATION_OPERATOR_EMAIL!, process.env.INTEGRATION_OPERATOR_PASSWORD!);
    const workers = await request("/api/v1/operarios", {}, admin.cookie);
    assert.equal(workers.response.status, 200);
    const activeWorker = workers.body.data.find((item: { activo: boolean; usuario_id?: number | null }) => item.activo && item.usuario_id === operator.user.id);
    assert.ok(activeWorker?.cuadrilla_id, "Debe existir un trabajador activo para programar la orden");
    const start = new Date(Date.UTC(2027, quoteId % 12, 5 + (quoteId % 20), 18, 0));
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    const order = await request("/api/v1/ordenes", { method: "POST", body: JSON.stringify({ cotizacionId: quoteId, cuadrillaId: activeWorker.cuadrilla_id, inicio: start.toISOString(), fin: end.toISOString() }) }, admin.cookie);
    assert.equal(order.response.status, 201);
    const overlappingQuote = await request("/api/v1/cotizaciones", { method: "POST", body: JSON.stringify({ zonaId: zone.id, objeto: `Solape automatizado ${Date.now()}` }) }, client.cookie);
    assert.equal(overlappingQuote.response.status, 201);
    const overlappingQuoteId = overlappingQuote.body.data.id;
    assert.equal((await request(`/api/v1/cotizaciones/${overlappingQuoteId}/visitas`, { method: "POST", body: JSON.stringify({ fecha: "2027-01-10" }) }, admin.cookie)).response.status, 201);
    assert.equal((await request(`/api/v1/cotizaciones/${overlappingQuoteId}/lineas`, { method: "POST", body: JSON.stringify({ concepto: "Servicio con solape", cantidad: 1, valorUnitario: 50000 }) }, admin.cookie)).response.status, 201);
    assert.equal((await request(`/api/v1/cotizaciones/${overlappingQuoteId}/hitos`, { method: "POST", body: JSON.stringify({ orden: 1, descripcion: "Pago total", porcentaje: 100 }) }, admin.cookie)).response.status, 201);
    assert.equal((await request(`/api/v1/cotizaciones/${overlappingQuoteId}/enviar`, { method: "POST" }, admin.cookie)).response.status, 200);
    assert.equal((await request(`/api/v1/cotizaciones/${overlappingQuoteId}/respuesta`, { method: "POST", body: JSON.stringify({ acepta: true }) }, client.cookie)).response.status, 200);
    const overlappingOrder = await request("/api/v1/ordenes", { method: "POST", body: JSON.stringify({ cotizacionId: overlappingQuoteId, cuadrillaId: activeWorker.cuadrilla_id, inicio: new Date(start.getTime() - 60 * 60 * 1000).toISOString(), fin: new Date(end.getTime() + 60 * 60 * 1000).toISOString() }) }, admin.cookie);
    assert.equal(overlappingOrder.response.status, 409);
    assert.equal(overlappingOrder.body.code, "BUSINESS_RULE");
    const clientReport = await request("/api/v1/reportes/periodo?desde=2027-01-01&hasta=2028-01-01", {}, client.cookie);
    assert.equal(clientReport.response.status, 403);
    const started = await request(`/api/v1/ordenes/${order.body.data.id}/iniciar`, { method: "PATCH" }, operator.cookie);
    assert.equal(started.response.status, 200);
    assert.equal(started.body.data.estado, "en_ejecucion");
    const finished = await request(`/api/v1/ordenes/${order.body.data.id}/finalizar`, { method: "PATCH", body: JSON.stringify({ nota: "Cierre de prueba integrado" }) }, operator.cookie);
    assert.equal(finished.response.status, 200);
    assert.equal(finished.body.data.estado, "finalizada");
    assert.equal(finished.body.data.nota_finalizacion, "Cierre de prueba integrado");
    const duplicateFinish = await request(`/api/v1/ordenes/${order.body.data.id}/finalizar`, { method: "PATCH", body: JSON.stringify({ nota: "Cierre duplicado" }) }, operator.cookie);
    assert.equal(duplicateFinish.response.status, 409);
    const history = await request(`/api/v1/clientes/${zone.cliente_id}/historial`, {}, client.cookie);
    assert.equal(history.response.status, 200);
    assert.ok(history.body.data.some((item: { id: number; estado: string }) => item.id === order.body.data.id && item.estado === "finalizada"));
    const duplicateOrder = await request("/api/v1/ordenes", { method: "POST", body: JSON.stringify({ cotizacionId: quoteId, cuadrillaId: activeWorker.cuadrilla_id, inicio: new Date(end.getTime() + 60 * 60 * 1000).toISOString(), fin: new Date(end.getTime() + 3 * 60 * 60 * 1000).toISOString() }) }, admin.cookie);
    assert.equal(duplicateOrder.response.status, 409);
    assert.equal(duplicateOrder.body.code, "QUOTE_ALREADY_SCHEDULED");

    const teamId = activeWorker.cuadrilla_id;
    const members = await request(`/api/v1/cuadrillas/${teamId}/miembros`, {}, admin.cookie);
    assert.equal(members.response.status, 200);
    const worker = members.body.data.find((item: { activo: boolean }) => item.activo);
    assert.ok(worker?.id, "La cuadrilla de integración debe tener un operario activo");
    const periodDay = 1 + (quoteId % 20);
    const periodStart = `2027-${String((quoteId % 12) + 1).padStart(2, "0")}-${String(periodDay).padStart(2, "0")}`;
    const periodEndDate = new Date(`${periodStart}T00:00:00Z`);
    periodEndDate.setUTCDate(periodEndDate.getUTCDate() + 4);
    const periodEnd = periodEndDate.toISOString().slice(0, 10);
    const report = await request(`/api/v1/reportes/periodo?desde=2026-01-01&hasta=2028-01-01&clienteId=${zone.cliente_id}`, {}, admin.cookie);
    assert.equal(report.response.status, 200);
    assert.ok(report.body.data.some((item: { cliente: string; servicios_finalizados: number }) => item.cliente && Number(item.servicios_finalizados) >= 1));
    const fieldSheet = await request("/api/v1/planillas", { method: "POST", body: JSON.stringify({ clienteId: zone.cliente_id, desde: periodStart, hasta: periodEnd, origen: "campo" }) }, admin.cookie);
    const adminSheet = await request("/api/v1/planillas", { method: "POST", body: JSON.stringify({ clienteId: zone.cliente_id, desde: periodStart, hasta: periodEnd, origen: "administrativa" }) }, admin.cookie);
    assert.equal(fieldSheet.response.status, 201);
    assert.equal(adminSheet.response.status, 201);
    const recordInput = { operarioId: worker.id, fecha: periodStart, zonaId: zone.id, actividad: "Mantenimiento", labor: "Prueba de conciliación", inicio: "08:00", fin: "17:00", descansoHoras: 1, dominicalFestivo: false };
    const fieldRecord = await request(`/api/v1/planillas/${fieldSheet.body.data.id}/registros`, { method: "POST", body: JSON.stringify(recordInput) }, admin.cookie);
    const adminRecord = await request(`/api/v1/planillas/${adminSheet.body.data.id}/registros`, { method: "POST", body: JSON.stringify(recordInput) }, admin.cookie);
    assert.equal(fieldRecord.response.status, 201);
    assert.equal(adminRecord.response.status, 201);
    const comparison = await request(`/api/v1/planillas/comparar?campoId=${fieldSheet.body.data.id}&adminId=${adminSheet.body.data.id}`, {}, admin.cookie);
    assert.equal(comparison.response.status, 200);
    assert.equal(comparison.body.data[0]?.resultado, "coincide");
    const reconciled = await request("/api/v1/planillas/conciliar", { method: "POST", body: JSON.stringify({ campoId: fieldSheet.body.data.id, adminId: adminSheet.body.data.id }) }, admin.cookie);
    assert.equal(reconciled.response.status, 200);
    const lockedRecord = await request(`/api/v1/planillas/${fieldSheet.body.data.id}/registros`, { method: "POST", body: JSON.stringify({ ...recordInput, inicio: "09:00" }) }, admin.cookie);
    assert.equal(lockedRecord.response.status, 409);

    const differenceStart = "2028-02-01";
    const differenceEnd = "2028-02-05";
    const differenceField = await request("/api/v1/planillas", { method: "POST", body: JSON.stringify({ clienteId: zone.cliente_id, desde: differenceStart, hasta: differenceEnd, origen: "campo" }) }, admin.cookie);
    const differenceAdmin = await request("/api/v1/planillas", { method: "POST", body: JSON.stringify({ clienteId: zone.cliente_id, desde: differenceStart, hasta: differenceEnd, origen: "administrativa" }) }, admin.cookie);
    assert.equal(differenceField.response.status, 201);
    assert.equal(differenceAdmin.response.status, 201);
    assert.equal((await request(`/api/v1/planillas/${differenceField.body.data.id}/registros`, { method: "POST", body: JSON.stringify({ ...recordInput, fecha: differenceStart, inicio: "08:00" }) }, admin.cookie)).response.status, 201);
    assert.equal((await request(`/api/v1/planillas/${differenceAdmin.body.data.id}/registros`, { method: "POST", body: JSON.stringify({ ...recordInput, fecha: differenceStart, inicio: "09:00" }) }, admin.cookie)).response.status, 201);
    const differenceComparison = await request(`/api/v1/planillas/comparar?campoId=${differenceField.body.data.id}&adminId=${differenceAdmin.body.data.id}`, {}, admin.cookie);
    assert.equal(differenceComparison.response.status, 200);
    assert.equal(differenceComparison.body.data[0]?.resultado, "diferente");
    const blockedReconciliation = await request("/api/v1/planillas/conciliar", { method: "POST", body: JSON.stringify({ campoId: differenceField.body.data.id, adminId: differenceAdmin.body.data.id }) }, admin.cookie);
    assert.equal(blockedReconciliation.response.status, 409);
    assert.equal(blockedReconciliation.body.code, "RECONCILIATION_BLOCKED");

    const mine = await request("/api/v1/ordenes/mias", {}, operator.cookie);
    assert.equal(mine.response.status, 200);
    assert.ok(mine.body.data.some((item: { id: number }) => item.id === order.body.data.id));
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await pool.end();
  }
});
