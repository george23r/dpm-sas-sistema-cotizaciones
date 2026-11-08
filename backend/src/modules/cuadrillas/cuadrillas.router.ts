import { Router } from "express";
import { list, members } from "./cuadrillas.controller.js";
export const cuadrillasRouter = Router();
cuadrillasRouter.get("/", ...list);
cuadrillasRouter.get("/:id/miembros", ...members);
