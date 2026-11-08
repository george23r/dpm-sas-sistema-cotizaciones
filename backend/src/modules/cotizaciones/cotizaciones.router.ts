import { Router } from "express";
import { addCost, addLine, addMilestone, addVisit, answer, create, detail, list, send } from "./cotizaciones.controller.js";

export const cotizacionesRouter = Router();
cotizacionesRouter.get("/", ...list);
cotizacionesRouter.post("/", ...create);
cotizacionesRouter.get("/:id", ...detail);
cotizacionesRouter.post("/:id/lineas", ...addLine);
cotizacionesRouter.post("/:id/visitas", ...addVisit);
cotizacionesRouter.post("/:id/hitos", ...addMilestone);
cotizacionesRouter.post("/:id/costos", ...addCost);
cotizacionesRouter.post("/:id/enviar", ...send);
cotizacionesRouter.post("/:id/respuesta", ...answer);
