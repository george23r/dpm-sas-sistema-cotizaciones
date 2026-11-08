import { z } from "zod";
import { pool } from "../../db/pool.js";
import { authenticate, requireRole } from "../../middlewares/auth.js";
import { asyncRoute, HttpError } from "../../shared/errors.js";

const clientId = z.coerce.number().int().positive();

export const historialCliente = [authenticate, requireRole("administrador", "cliente"), asyncRoute(async (request, response) => {
  const parsed = clientId.safeParse(request.params.id);
  if (!parsed.success) throw new HttpError(422, "VALIDATION_ERROR", "El cliente no es válido.");
  const user = request.user;
  if (!user) throw new HttpError(401, "UNAUTHENTICATED", "La sesión es requerida.");
  const result = await pool.query(`
    SELECT o.id, o.cotizacion_id, o.zona_id, z.nombre AS zona, z.direccion,
           c.id AS cliente_id, c.nombre AS cliente, o.tipo_servicio,
           o.cuadrilla_id, q.nombre AS cuadrilla, o.inicio, o.fin,
           o.estado, o.iniciada_en, o.finalizada_en, o.nota_finalizacion
      FROM dpm.ordenes_trabajo o
      JOIN dpm.zonas z ON z.id=o.zona_id
      JOIN dpm.clientes c ON c.id=z.cliente_id
      LEFT JOIN dpm.cuadrillas q ON q.id=o.cuadrilla_id
     WHERE c.id=$1
       AND o.estado='finalizada'
       AND ($2='administrador' OR c.usuario_id=$3)
     ORDER BY o.finalizada_en DESC`,
    [parsed.data, user.rol, user.id],
  );
  response.json({ data: result.rows });
})];
