import { Router } from "express";
import { clientes, createClient, createOperario, createService, createZone, operarios, servicios, updateClient, updateOperario, updateService, updateZone, zonas } from "./catalogos.controller.js";
import { historialCliente } from "./historial.controller.js";

export const catalogosRouter = Router();
catalogosRouter.get("/clientes/:id/historial", ...historialCliente);
catalogosRouter.get("/clientes", ...clientes);
catalogosRouter.post("/clientes", ...createClient);
catalogosRouter.patch("/clientes/:id", ...updateClient);
catalogosRouter.get("/zonas", ...zonas);
catalogosRouter.post("/zonas", ...createZone);
catalogosRouter.patch("/zonas/:id", ...updateZone);
catalogosRouter.get("/servicios", ...servicios);
catalogosRouter.post("/servicios", ...createService);
catalogosRouter.patch("/servicios/:id", ...updateService);
catalogosRouter.get("/operarios", ...operarios);
catalogosRouter.post("/operarios", ...createOperario);
catalogosRouter.patch("/operarios/:id", ...updateOperario);

