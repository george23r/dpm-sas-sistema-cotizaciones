import type { Request, Response } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { asyncRoute, HttpError } from "../../shared/errors.js";
import { addPart, createQuote, findQuote, findQuoteParts, findQuotes, getClientForUser } from "./cotizaciones.repository.js";

const idSchema = z.coerce.number().int().positive();
const quoteSchema = z.object({ clienteId: z.number().int().positive().optional(), zonaId: z.number().int().positive(), objeto: z.string().trim().min(3).max(200), alcance: z.string().trim().max(5000).optional(), incluye: z.string().trim().max(5000).optional(), tiempoEjecucion: z.string().trim().max(200).optional(), observaciones: z.string().trim().max(5000).optional(), vigenciaDias: z.number().int().positive().max(90).optional() });
const lineSchema = z.object({ servicioId: z.number().int().positive().nullable().optional(), concepto: z.string().trim().min(1).max(200), cantidad: z.number().positive(), valorUnitario: z.number().nonnegative() });
const visitSchema = z.object({ fecha: z.string().date(), observaciones: z.string().trim().max(2000).optional() });
const milestoneSchema = z.object({ orden: z.number().int().positive(), descripcion: z.string().trim().min(1).max(200), porcentaje: z.number().positive().max(100) });
const costSchema = z.object({ tipo: z.enum(["mano_obra", "maquinaria", "herramientas", "combustible", "transporte", "otro"]), descripcion: z.string().trim().min(1).max(200), cantidad: z.number().positive(), valorUnitario: z.number().nonnegative() });

function quoteId(request: Request) { const parsed = idSchema.safeParse(request.params.id); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "El identificador no es válido."); return parsed.data; }
function current(request: { user?: { id: number; rol: string } }) { if (!request.user) throw new HttpError(401, "UNAUTHENTICATED", "La sesión es requerida."); return request.user; }

export const list = [authenticate, asyncRoute(async (request, response) => { const user = current(request); const estado = typeof request.query.estado === "string" ? request.query.estado : undefined; const clienteId = typeof request.query.clienteId === "string" ? Number(request.query.clienteId) : undefined; response.json({ data: await findQuotes(user.id, user.rol, { estado, clienteId }) }); })];

export const detail = [authenticate, asyncRoute(async (request, response) => { const user = current(request); const id = quoteId(request); const quote = await findQuote(id, user.id, user.rol); if (!quote) throw new HttpError(404, "QUOTE_NOT_FOUND", "La cotización no existe o no está disponible."); response.json({ data: { ...quote, ...(await findQuoteParts(id, user.rol === "administrador")) } }); })];

export const create = [authenticate, requireRole("administrador", "cliente"), asyncRoute(async (request, response) => {
  const user = current(request);
  const parsed = quoteSchema.safeParse(request.body);
  if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Los datos de la cotización no son válidos.", parsed.error.flatten().fieldErrors);
  const clienteId = user.rol === "cliente" ? await getClientForUser(user.id) : parsed.data.clienteId;
  if (!clienteId) throw new HttpError(403, "CLIENT_PROFILE_REQUIRED", "La cuenta no tiene un cliente asociado.");
  if (user.rol === "administrador" && !parsed.data.clienteId) throw new HttpError(422, "VALIDATION_ERROR", "El cliente es obligatorio para administración.");
  const zone = await pool.query<{ cliente_id: number }>("SELECT cliente_id FROM dpm.zonas WHERE id=$1", [parsed.data.zonaId]);
  if (!zone.rows[0]) throw new HttpError(404, "ZONE_NOT_FOUND", "La zona no existe.");
  if (zone.rows[0].cliente_id !== clienteId) throw new HttpError(403, "ZONE_NOT_OWNED", "La zona no pertenece al cliente seleccionado.");
  const id = await createQuote({ ...parsed.data, clienteId, creadaPor: user.id });
  response.status(201).json({ data: { id } });
})];

async function add(request: Request, response: Response, kind: "linea" | "visita" | "hito" | "costo") {
  const user = current(request); const id = quoteId(request); const quote = await findQuote(id, user.id, user.rol); if (!quote) throw new HttpError(404, "QUOTE_NOT_FOUND", "La cotización no existe o no está disponible."); if (user.rol !== "administrador") throw new HttpError(403, "FORBIDDEN", "Solo administración puede completar esta cotización.");
  let values: unknown[];
  if (kind === "linea") { const parsed = lineSchema.safeParse(request.body); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Los datos enviados no son válidos.", parsed.error.flatten().fieldErrors); values = [parsed.data.servicioId ?? null, parsed.data.concepto, parsed.data.cantidad, parsed.data.valorUnitario]; }
  else if (kind === "visita") { const parsed = visitSchema.safeParse(request.body); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Los datos enviados no son válidos.", parsed.error.flatten().fieldErrors); values = [parsed.data.fecha, user.id, parsed.data.observaciones ?? null]; }
  else if (kind === "hito") { const parsed = milestoneSchema.safeParse(request.body); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Los datos enviados no son válidos.", parsed.error.flatten().fieldErrors); values = [parsed.data.orden, parsed.data.descripcion, parsed.data.porcentaje]; }
  else { const parsed = costSchema.safeParse(request.body); if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "Los datos enviados no son válidos.", parsed.error.flatten().fieldErrors); values = [parsed.data.tipo, parsed.data.descripcion, parsed.data.cantidad, parsed.data.valorUnitario]; }
  const client = await pool.connect(); try { await client.query("BEGIN"); await addPart(client, id, kind, values); await client.query("COMMIT"); response.status(201).json({ data: { id } }); } catch (error) { await client.query("ROLLBACK"); throw error; } finally { client.release(); }
}

export const addLine = [authenticate, requireRole("administrador"), asyncRoute((request, response) => add(request, response, "linea"))];
export const addVisit = [authenticate, requireRole("administrador"), asyncRoute((request, response) => add(request, response, "visita"))];
export const addMilestone = [authenticate, requireRole("administrador"), asyncRoute((request, response) => add(request, response, "hito"))];
export const addCost = [authenticate, requireRole("administrador"), asyncRoute((request, response) => add(request, response, "costo"))];

export const send = [authenticate, requireRole("administrador"), asyncRoute(async (request, response) => { const user = current(request); const id = quoteId(request); if (!await findQuote(id, user.id, user.rol)) throw new HttpError(404, "QUOTE_NOT_FOUND", "La cotización no existe."); try { await pool.query("CALL dpm.sp_enviar_cotizacion($1)", [id]); } catch (error) { throw new HttpError(409, "QUOTE_SEND_BLOCKED", error instanceof Error ? error.message : "La cotización no cumple las condiciones de envío."); } response.status(200).json({ data: { id, estado: "enviada" } }); })];
export const answer = [authenticate, requireRole("cliente"), asyncRoute(async (request, response) => { const user = current(request); const id = quoteId(request); const acepta = z.object({ acepta: z.boolean() }).safeParse(request.body); if (!acepta.success) throw new HttpError(422, "VALIDATION_ERROR", "Indica si aceptas la cotización."); if (!await findQuote(id, user.id, user.rol)) throw new HttpError(404, "QUOTE_NOT_FOUND", "La cotización no existe o no está disponible."); try { await pool.query("CALL dpm.sp_responder_cotizacion($1,$2)", [id, acepta.data.acepta]); } catch (error) { throw new HttpError(409, "QUOTE_RESPONSE_BLOCKED", error instanceof Error ? error.message : "La cotización no puede recibir respuesta."); } response.json({ data: { id, estado: acepta.data.acepta ? "aceptada" : "rechazada" } }); })];
