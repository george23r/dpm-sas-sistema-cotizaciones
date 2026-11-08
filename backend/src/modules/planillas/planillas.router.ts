import { Router } from "express";
import { addRecord, compare, create, list, reconcile } from "./planillas.controller.js";
export const planillasRouter = Router();
planillasRouter.get("/", ...list);
planillasRouter.get("/comparar", ...compare);
planillasRouter.post("/", ...create);
planillasRouter.post("/conciliar", ...reconcile);
planillasRouter.post("/:id/registros", ...addRecord);
