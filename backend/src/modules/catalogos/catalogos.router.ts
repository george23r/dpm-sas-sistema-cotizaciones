import { Router } from "express";
import { clientes, createClient, createZone, operarios, servicios, updateClient, updateZone, zonas } from "./catalogos.controller.js";

export const catalogosRouter = Router();
catalogosRouter.get("/clientes", ...clientes);
catalogosRouter.post("/clientes", ...createClient);
catalogosRouter.patch("/clientes/:id", ...updateClient);
catalogosRouter.get("/zonas", ...zonas);
catalogosRouter.post("/zonas", ...createZone);
catalogosRouter.patch("/zonas/:id", ...updateZone);
catalogosRouter.get("/servicios", ...servicios);
catalogosRouter.get("/operarios", ...operarios);
