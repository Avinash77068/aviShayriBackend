import rateLimit from "express-rate-limit";
import env from "../config/env.js";
import { HTTP } from "../constants/index.js";

const handler = (_req, res) =>
  res.status(HTTP.TOO_MANY).json({ success: false, message: "Too many requests, please try again later" });

/** Global limiter applied to the whole API. */
export const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler,
});

/** Stricter limiter for auth endpoints (brute-force protection). */
export const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  handler,
});
