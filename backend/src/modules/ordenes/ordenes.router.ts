import { Router } from "express";
import { assign, create, detail, finish, list, start } from "./ordenes.controller.js";

export const ordenesRouter = Router();
ordenesRouter.get("/", ...list);
ordenesRouter.post("/", ...create);
ordenesRouter.get("/:id", ...detail);
ordenesRouter.patch("/:id", ...assign);
ordenesRouter.patch("/:id/iniciar", ...start);
ordenesRouter.patch("/:id/finalizar", ...finish);
