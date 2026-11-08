import { Router } from "express";
import { period } from "./reportes.controller.js";
export const reportesRouter = Router();
reportesRouter.get("/periodo", ...period);
