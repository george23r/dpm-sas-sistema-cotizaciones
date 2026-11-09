import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authenticate } from "../../middlewares/auth.js";
import { loadEnv } from "../../config/env.js";
import { login, logout, me } from "./auth.controller.js";

export const authRouter = Router();
const env = loadEnv();
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.LOGIN_RATE_LIMIT_MAX,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});

authRouter.post("/login", loginLimiter, login);
authRouter.get("/me", authenticate, me);
authRouter.post("/logout", logout);
