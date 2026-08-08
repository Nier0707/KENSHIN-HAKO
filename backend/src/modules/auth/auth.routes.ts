import { Router } from "express";
import rateLimit from "express-rate-limit";
import { loginHandler, meHandler } from "./auth.controller";
import { requireAuth } from "../../middleware/auth";

const router = Router();

// Slows down credential-stuffing / brute-force attempts against login.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts. Try again later." },
});

router.post("/login", loginLimiter, loginHandler);
router.get("/me", requireAuth, meHandler);

export default router;
