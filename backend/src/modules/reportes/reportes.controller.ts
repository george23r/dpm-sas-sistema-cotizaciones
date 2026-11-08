import { z } from "zod";
import { pool } from "../../db/pool.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { asyncRoute, HttpError } from "../../shared/errors.js";

export const period = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => { const parsed = z.object({ desde: z.string().date(), hasta: z.string().date(), clienteId: z.coerce.number().int().positive().optional() }).safeParse(request.query); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "El periodo del reporte no es válido.", parsed.error.flatten().fieldErrors); const result = await pool.query(`SELECT * FROM dpm.fn_reporte_periodo($1,$2,$3)`, [parsed.data.desde, parsed.data.hasta, parsed.data.clienteId ?? null]); response.json({ data: result.rows }); })];

export const summary = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => {
  const parsed = z.object({ desde: z.string().date().optional(), hasta: z.string().date().optional(), clienteId: z.coerce.number().int().positive().optional() }).safeParse(request.query);
  if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Los filtros del resumen no son válidos.", parsed.error.flatten().fieldErrors);
  const { desde, hasta, clienteId } = parsed.data;
  const quoteParams: unknown[] = []; const quoteWhere = ["TRUE"];
  const orderParams: unknown[] = []; const orderWhere = ["TRUE"];
  if (clienteId) { quoteWhere.push(`q.cliente_id=$${quoteParams.push(clienteId)}`); orderWhere.push(`z.cliente_id=$${orderParams.push(clienteId)}`); }
  if (desde) { quoteWhere.push(`q.solicitada_en::date >= $${quoteParams.push(desde)}`); orderWhere.push(`o.inicio::date >= $${orderParams.push(desde)}`); }
  if (hasta) { quoteWhere.push(`q.solicitada_en::date <= $${quoteParams.push(hasta)}`); orderWhere.push(`o.inicio::date <= $${orderParams.push(hasta)}`); }
  const [quotes, orders, quoteActivity, orderActivity] = await Promise.all([
    pool.query(`SELECT count(*) FILTER (WHERE q.estado='solicitada')::int AS solicitadas, count(*) FILTER (WHERE q.estado='enviada')::int AS enviadas, count(*) FILTER (WHERE q.estado='aceptada')::int AS aceptadas, count(*) FILTER (WHERE q.estado='enviada' AND q.enviada_en + make_interval(days => q.vigencia_dias) >= now())::int AS pendientes_respuesta FROM dpm.cotizaciones q WHERE ${quoteWhere.join(" AND ")}`, quoteParams),
    pool.query(`SELECT count(*) FILTER (WHERE o.estado='pendiente')::int AS programadas, count(*) FILTER (WHERE o.estado='en_ejecucion')::int AS en_ejecucion, count(*) FILTER (WHERE o.estado='finalizada')::int AS finalizadas FROM dpm.ordenes_trabajo o JOIN dpm.zonas z ON z.id=o.zona_id WHERE ${orderWhere.join(" AND ")}`, orderParams),
    pool.query(`SELECT q.solicitada_en::date AS fecha, count(*)::int AS total FROM dpm.cotizaciones q WHERE ${quoteWhere.join(" AND ")} GROUP BY 1`, quoteParams),
    pool.query(`SELECT o.inicio::date AS fecha, count(*)::int AS total FROM dpm.ordenes_trabajo o JOIN dpm.zonas z ON z.id=o.zona_id WHERE ${orderWhere.join(" AND ")} GROUP BY 1`, orderParams),
  ]);
  const activityMap = new Map<string, number>();
  for (const row of [...quoteActivity.rows, ...orderActivity.rows]) activityMap.set(String(row.fecha), (activityMap.get(String(row.fecha)) ?? 0) + Number(row.total));
  const actividad = [...activityMap.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 14).map(([fecha, total]) => ({ fecha, total }));
  response.json({ data: { cotizaciones: quotes.rows[0], ordenes: orders.rows[0], actividad } });
})];

