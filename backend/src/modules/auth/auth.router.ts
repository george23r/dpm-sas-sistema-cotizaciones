import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middlewares/auth.js";
import { login, logout, me } from "./auth.controller.js";

export const authRouter = Router();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

authRouter.post("/login", loginLimiter, login);
authRouter.get("/me", authenticate, me);
authRouter.post("/logout", logout);
