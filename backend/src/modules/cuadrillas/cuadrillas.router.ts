import { Router } from "express";
import { create, list, members, update } from "./cuadrillas.controller.js";
export const cuadrillasRouter = Router();
cuadrillasRouter.get("/", ...list);
cuadrillasRouter.post("/", ...create);
cuadrillasRouter.patch("/:id", ...update);
cuadrillasRouter.get("/:id/miembros", ...members);
