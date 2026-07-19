import { Router } from "express";
import authRoutes from "./auth.routes.js";
import shayariRoutes from "./shayari.routes.js";
import commentRoutes from "./comment.routes.js";
import userRoutes from "./user.routes.js";
import notificationRoutes from "./notification.routes.js";
import { categories, tags, authors, languages } from "./content.routes.js";
import { analytics, media, ads, homepage, seo } from "./misc.routes.js";

const router = Router();

router.get("/health", (_req, res) =>
  res.json({ success: true, status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() })
);

router.use("/auth", authRoutes);
router.use("/shayari", shayariRoutes);
router.use("/categories", categories);
router.use("/tags", tags);
router.use("/authors", authors);
router.use("/languages", languages);
router.use("/comments", commentRoutes);
router.use("/users", userRoutes);
router.use("/notifications", notificationRoutes);
router.use("/analytics", analytics);
router.use("/media", media);
router.use("/ads", ads);
router.use("/homepage", homepage);
router.use("/seo", seo);

export default router;
