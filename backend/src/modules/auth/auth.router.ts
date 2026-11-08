import { Router } from "express";
import { authenticate } from "../../middlewares/auth.js";
import { login, logout, me } from "./auth.controller.js";

export const authRouter = Router();
authRouter.post("/login", login);
authRouter.get("/me", authenticate, me);
authRouter.post("/logout", logout);
