import type { PoolClient, QueryResultRow } from "pg";
import { pool } from "../../db/pool.js";

export interface QuoteRow extends QueryResultRow { id: number; consecutivo: string; cliente_id: number; zona_id: number; objeto: string; alcance: string | null; incluye: string | null; tiempo_ejecucion: string | null; observaciones: string | null; vigencia_dias: number; estado: string; total: string | null; creada_por: number; solicitada_en: string; enviada_en: string | null; cliente: string; zona: string; }

export async function findQuotes(userId: number, role: string, filters: { estado?: string; clienteId?: number; search?: string; desde?: string; hasta?: string; page: number; pageSize: number }) {
  const params: unknown[] = [];
  const conditions = [role === "cliente" ? `q.cliente_id = (SELECT id FROM dpm.clientes WHERE usuario_id = $${params.push(userId)})` : "TRUE"];
  if (filters.estado) conditions.push(`q.estado = $${params.push(filters.estado)}`);
  if (role === "administrador" && filters.clienteId) conditions.push(`q.cliente_id = $${params.push(filters.clienteId)}`);
  if (filters.search) { const term = `%${filters.search}%`; conditions.push(`(q.objeto ILIKE $${params.push(term)} OR c.nombre ILIKE $${params.length} OR z.nombre ILIKE $${params.length})`); }
  if (filters.desde) conditions.push(`q.solicitada_en::date >= $${params.push(filters.desde)}`);
  if (filters.hasta) conditions.push(`q.solicitada_en::date <= $${params.push(filters.hasta)}`);
  const from = `FROM dpm.cotizaciones q JOIN dpm.clientes c ON c.id=q.cliente_id JOIN dpm.zonas z ON z.id=q.zona_id WHERE ${conditions.join(" AND ")}`;
  const count = await pool.query<{ total: string }>(`SELECT count(*)::text AS total ${from}`, params);
  const dataParams = [...params, filters.pageSize, (filters.page - 1) * filters.pageSize];
  const result = await pool.query<QuoteRow>(`SELECT q.*, c.nombre AS cliente, z.nombre AS zona ${from} ORDER BY q.solicitada_en DESC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`, dataParams);
  return { rows: result.rows, total: Number(count.rows[0]?.total ?? 0) };
}

export async function findQuote(id: number, userId: number, role: string) {
  const result = await pool.query<QuoteRow>(`SELECT q.*, c.nombre AS cliente, z.nombre AS zona FROM dpm.cotizaciones q JOIN dpm.clientes c ON c.id=q.cliente_id JOIN dpm.zonas z ON z.id=q.zona_id WHERE q.id=$1 AND ($2 = 'administrador' OR c.usuario_id=$3)`, [id, role, userId]);
  return result.rows[0];
}

export async function findQuoteParts(id: number, includeCosts: boolean) {
  const [lines, visits, milestones, costs] = await Promise.all([
    pool.query(`SELECT id, servicio_id, concepto, cantidad, valor_unitario, valor_total FROM dpm.cotizacion_lineas WHERE cotizacion_id=$1 ORDER BY id`, [id]),
    pool.query(`SELECT id, fecha, realizada_por, observaciones FROM dpm.visitas_tecnicas WHERE cotizacion_id=$1 ORDER BY fecha DESC, id DESC`, [id]),
    pool.query(`SELECT orden, descripcion, porcentaje FROM dpm.cotizacion_hitos WHERE cotizacion_id=$1 ORDER BY orden`, [id]),
    includeCosts ? pool.query(`SELECT id, tipo, descripcion, cantidad, valor_unitario, subtotal FROM dpm.cotizacion_costos WHERE cotizacion_id=$1 ORDER BY id`, [id]) : Promise.resolve({ rows: [] }),
  ]);
  return { lineas: lines.rows, visitas: visits.rows, hitos: milestones.rows, ...(includeCosts ? { costos: costs.rows } : {}) };
}

export async function createQuote(input: { clienteId: number; zonaId: number; objeto: string; alcance?: string; incluye?: string; tiempoEjecucion?: string; observaciones?: string; vigenciaDias?: number; creadaPor: number }) {
  const result = await pool.query<QuoteRow>(`INSERT INTO dpm.cotizaciones (cliente_id,zona_id,objeto,alcance,incluye,tiempo_ejecucion,observaciones,vigencia_dias,creada_por) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`, [input.clienteId, input.zonaId, input.objeto, input.alcance ?? null, input.incluye ?? null, input.tiempoEjecucion ?? null, input.observaciones ?? null, input.vigenciaDias ?? 15, input.creadaPor]);
  if (!result.rows[0]) throw new Error("No se pudo crear la cotización.");
  return result.rows[0].id;
}

export async function getClientForUser(userId: number) {
  const result = await pool.query<{ id: number }>("SELECT id FROM dpm.clientes WHERE usuario_id=$1", [userId]);
  return result.rows[0]?.id;
}

export async function addPart(client: PoolClient, quoteId: number, kind: "linea" | "visita" | "hito" | "costo", values: unknown[]) {
  const queries = {
    linea: "INSERT INTO dpm.cotizacion_lineas (cotizacion_id,servicio_id,concepto,cantidad,valor_unitario) VALUES ($1,$2,$3,$4,$5)",
    visita: "INSERT INTO dpm.visitas_tecnicas (cotizacion_id,fecha,realizada_por,observaciones) VALUES ($1,$2,$3,$4)",
    hito: "INSERT INTO dpm.cotizacion_hitos (cotizacion_id,orden,descripcion,porcentaje) VALUES ($1,$2,$3,$4)",
    costo: "INSERT INTO dpm.cotizacion_costos (cotizacion_id,tipo,descripcion,cantidad,valor_unitario) VALUES ($1,$2,$3,$4,$5)",
  } as const;
  await client.query(queries[kind], [quoteId, ...values]);
}

