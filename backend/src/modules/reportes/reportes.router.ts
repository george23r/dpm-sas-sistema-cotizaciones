import { Router } from "express";
import { period, summary } from "./reportes.controller.js";
export const reportesRouter = Router();
reportesRouter.get("/periodo", ...period);
reportesRouter.get("/resumen", ...summary);

