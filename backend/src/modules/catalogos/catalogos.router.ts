import { Router } from "express";
import { clientes, operarios, servicios, zonas } from "./catalogos.controller.js";

export const catalogosRouter = Router();
catalogosRouter.get("/clientes", ...clientes);
catalogosRouter.get("/zonas", ...zonas);
catalogosRouter.get("/servicios", ...servicios);
catalogosRouter.get("/operarios", ...operarios);
