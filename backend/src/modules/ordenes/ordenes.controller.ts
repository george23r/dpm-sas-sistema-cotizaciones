import type { Request } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { asyncRoute, HttpError } from "../../shared/errors.js";

const id = z.coerce.number().int().positive();
const orderSchema = z.object({ cotizacionId: z.number().int().positive(), cuadrillaId: z.number().int().positive().nullable().optional(), inicio: z.string().datetime({ offset: true }), fin: z.string().datetime({ offset: true }) });
const assignmentSchema = z.object({ cuadrillaId: z.number().int().positive().nullable() });
const finalizationSchema = z.object({ nota: z.string().trim().max(2000).optional() });
const listQuerySchema = z.object({ estado: z.enum(["pendiente", "en_ejecucion", "finalizada"]).optional(), clienteId: id.optional(), cuadrillaId: id.optional() });

function user(request: Request) { if (!request.user) throw new HttpError(401, "UNAUTHENTICATED", "La sesión es requerida."); return request.user; }
function pathId(request: Request) { const parsed = id.safeParse(request.params.id); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "El identificador no es válido."); return parsed.data; }
function translate(error: unknown): never { const message = error instanceof Error ? error.message : "No fue posible completar la operación."; if (/cuadrilla|cotización|operario|horario|orden/i.test(message)) throw new HttpError(409, "BUSINESS_RULE", message); throw error; }

export const list = [authenticate, requireRole("administrador", "cliente", "operario"), asyncRoute(async (request, response) => {
  const current = user(request); const parsedQuery = listQuerySchema.safeParse(request.query); if (!parsedQuery.success) throw new HttpError(422, "VALIDATION_ERROR", "Los filtros de órdenes no son válidos.", parsedQuery.error.flatten().fieldErrors); const { estado, clienteId, cuadrillaId } = parsedQuery.data; const params: unknown[] = []; const filters = ["TRUE"];
  if (estado) filters.push(`o.estado = $${params.push(estado)}`);
  if (clienteId) filters.push(`c.id = $${params.push(clienteId)}`);
  if (cuadrillaId) filters.push(`o.cuadrilla_id = $${params.push(cuadrillaId)}`);
  if (current.rol === "cliente") filters.push(`z.cliente_id = (SELECT id FROM dpm.clientes WHERE usuario_id = $${params.push(current.id)})`);
  if (current.rol === "operario") filters.push(`o.cuadrilla_id = (SELECT cuadrilla_id FROM dpm.operarios WHERE usuario_id = $${params.push(current.id)} AND activo = true)`);
  const result = await pool.query(`SELECT o.id, o.cotizacion_id, o.zona_id, z.nombre AS zona, z.direccion, c.id AS cliente_id, c.nombre AS cliente, o.tipo_servicio, o.cuadrilla_id, q.nombre AS cuadrilla, o.inicio, o.fin, o.estado, o.iniciada_en, o.finalizada_en, o.nota_finalizacion FROM dpm.ordenes_trabajo o JOIN dpm.zonas z ON z.id=o.zona_id JOIN dpm.clientes c ON c.id=z.cliente_id LEFT JOIN dpm.cuadrillas q ON q.id=o.cuadrilla_id WHERE ${filters.join(" AND ")} ORDER BY o.inicio`, params);
  response.json({ data: result.rows });
})];

export const mine = [authenticate, requireRole("operario"), asyncRoute(async (request, response) => {
  const current = user(request);
  const result = await pool.query(`SELECT o.id, o.cotizacion_id, o.zona_id, z.nombre AS zona, z.direccion, c.id AS cliente_id, c.nombre AS cliente, o.tipo_servicio, o.cuadrilla_id, q.nombre AS cuadrilla, o.inicio, o.fin, o.estado, o.iniciada_en, o.finalizada_en, o.nota_finalizacion FROM dpm.ordenes_trabajo o JOIN dpm.zonas z ON z.id=o.zona_id JOIN dpm.clientes c ON c.id=z.cliente_id LEFT JOIN dpm.cuadrillas q ON q.id=o.cuadrilla_id WHERE o.cuadrilla_id=(SELECT cuadrilla_id FROM dpm.operarios WHERE usuario_id=$1 AND activo=true) ORDER BY o.inicio`, [current.id]);
  response.json({ data: result.rows });
})];

export const detail = [authenticate, requireRole("administrador", "cliente", "operario"), asyncRoute(async (request, response) => {
  const current = user(request); const orderId = pathId(request); const result = await pool.query(`SELECT o.id, o.cotizacion_id, o.zona_id, z.nombre AS zona, z.direccion, c.id AS cliente_id, c.nombre AS cliente, o.tipo_servicio, o.cuadrilla_id, q.nombre AS cuadrilla, o.inicio, o.fin, o.estado, o.iniciada_en, o.finalizada_en, o.nota_finalizacion FROM dpm.ordenes_trabajo o JOIN dpm.zonas z ON z.id=o.zona_id JOIN dpm.clientes c ON c.id=z.cliente_id LEFT JOIN dpm.cuadrillas q ON q.id=o.cuadrilla_id WHERE o.id=$1 AND ($2='administrador' OR ($2='cliente' AND c.usuario_id=$3) OR ($2='operario' AND o.cuadrilla_id=(SELECT cuadrilla_id FROM dpm.operarios WHERE usuario_id=$3 AND activo=true)))`, [orderId, current.rol, current.id]);
  if (!result.rows[0]) throw new HttpError(404, "ORDER_NOT_FOUND", "La orden no existe o no está disponible."); response.json({ data: result.rows[0] });
})];

export const create = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => {
  const current = user(request); const parsed = orderSchema.safeParse(request.body); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Los datos de programación no son válidos.", parsed.error.flatten().fieldErrors);
  const quote = await pool.query<{ zona_id: number; tipo_servicio: string; cliente_id: number }>(`SELECT q.zona_id, q.objeto AS tipo_servicio, q.cliente_id FROM dpm.cotizaciones q WHERE q.id=$1 AND q.estado='aceptada'`, [parsed.data.cotizacionId]);
  if (!quote.rows[0]) throw new HttpError(409, "QUOTE_NOT_ACCEPTED", "Solo se puede programar una cotización aceptada.");
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(7002, $1)", [parsed.data.cotizacionId]);
    const duplicate = await client.query<{ id: number }>("SELECT id FROM dpm.ordenes_trabajo WHERE cotizacion_id=$1 LIMIT 1", [parsed.data.cotizacionId]);
    if (duplicate.rows[0]) throw new HttpError(409, "QUOTE_ALREADY_SCHEDULED", "La cotización aceptada ya tiene una orden de trabajo.");
    if (parsed.data.cuadrillaId !== null && parsed.data.cuadrillaId !== undefined) {
      const crew = await client.query("SELECT id FROM dpm.cuadrillas WHERE id=$1 AND activa=true FOR SHARE", [parsed.data.cuadrillaId]);
      if (!crew.rows[0]) throw new HttpError(409, "TEAM_UNAVAILABLE", "La cuadrilla no existe o está desactivada para nuevas asignaciones.");
    }
    const result = await client.query<{ id: number }>(`INSERT INTO dpm.ordenes_trabajo (cotizacion_id,zona_id,tipo_servicio,cuadrilla_id,inicio,fin) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, [parsed.data.cotizacionId, quote.rows[0].zona_id, quote.rows[0].tipo_servicio, parsed.data.cuadrillaId ?? null, parsed.data.inicio, parsed.data.fin]);
    const created = result.rows[0];
    if (!created) throw new HttpError(500, "ORDER_CREATE_FAILED", "No fue posible crear la orden.");
    await client.query("COMMIT");
    response.status(201).json({ data: created });
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof HttpError) throw error;
    translate(error);
  } finally { client.release(); }
  void current;
})];

export const assign = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => {
  const parsed = assignmentSchema.safeParse(request.body); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "La cuadrilla no es válida."); const orderId = pathId(request); const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (parsed.data.cuadrillaId !== null) {
      const crew = await client.query("SELECT id FROM dpm.cuadrillas WHERE id=$1 AND activa=true FOR SHARE", [parsed.data.cuadrillaId]);
      if (!crew.rows[0]) throw new HttpError(409, "TEAM_UNAVAILABLE", "La cuadrilla no existe o está desactivada para nuevas asignaciones.");
    }
    const result = await client.query(`UPDATE dpm.ordenes_trabajo SET cuadrilla_id=$2 WHERE id=$1 RETURNING id, cuadrilla_id`, [orderId, parsed.data.cuadrillaId]);
    if (!result.rows[0]) throw new HttpError(404, "ORDER_NOT_FOUND", "La orden no existe.");
    await client.query("COMMIT"); response.json({ data: result.rows[0] });
  } catch (error) { await client.query("ROLLBACK"); if (error instanceof HttpError) throw error; translate(error); } finally { client.release(); }
})];

export const start = [authenticate, requireRole("operario"), asyncRoute(async (request, response) => { const current = user(request); const orderId = pathId(request); const result = await pool.query(`UPDATE dpm.ordenes_trabajo SET estado='en_ejecucion', iniciada_en=now() WHERE id=$1 AND cuadrilla_id=(SELECT cuadrilla_id FROM dpm.operarios WHERE usuario_id=$2 AND activo=true) AND estado='pendiente' RETURNING id, estado, iniciada_en`, [orderId, current.id]); if (!result.rows[0]) throw new HttpError(409, "ORDER_START_NOT_ALLOWED", "La orden no está pendiente o no pertenece a tu cuadrilla."); response.json({ data: result.rows[0] }); })];

export const finish = [authenticate, requireRole("operario"), asyncRoute(async (request, response) => { const current = user(request); const parsed = finalizationSchema.safeParse(request.body ?? {}); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "La nota de finalización no es válida."); const orderId = pathId(request); const result = await pool.query(`UPDATE dpm.ordenes_trabajo SET estado='finalizada', finalizada_en=now(), finalizada_por=(SELECT id FROM dpm.operarios WHERE usuario_id=$2 AND activo=true), nota_finalizacion=$3 WHERE id=$1 AND cuadrilla_id=(SELECT cuadrilla_id FROM dpm.operarios WHERE usuario_id=$2 AND activo=true) AND estado='en_ejecucion' RETURNING id, estado, finalizada_en, nota_finalizacion`, [orderId, current.id, parsed.data.nota ?? null]); if (!result.rows[0]) throw new HttpError(409, "ORDER_FINISH_NOT_ALLOWED", "La orden no está en ejecución o no pertenece a tu cuadrilla."); response.json({ data: result.rows[0] }); })];


