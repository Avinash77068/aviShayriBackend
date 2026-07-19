import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import hpp from "hpp";
import swaggerUi from "swagger-ui-express";

import env from "./config/env.js";
import logger from "./config/logger.js";
import routes from "./routes/index.js";
import { seoController } from "./routes/misc.routes.js";
import { mongoSanitize } from "./middlewares/sanitize.middleware.js";
import { globalLimiter } from "./middlewares/rateLimit.middleware.js";
import { notFound, errorHandler } from "./middlewares/error.middleware.js";
import { swaggerSpec } from "./docs/swagger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// Behind a proxy (Render/Railway/Nginx) — needed for secure cookies + rate limit IPs.
app.set("trust proxy", 1);

/* -------- Security & parsing -------- */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: env.isProd ? undefined : false,
  })
);
// Allow every origin. `origin: true` reflects the incoming Origin header back,
// which is required to keep `credentials: true` working (a literal "*" is
// rejected by browsers when credentials are sent).
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(cookieParser());
app.use(mongoSanitize);
app.use(hpp());
app.use(compression());
if (!env.isProd) app.use(morgan("dev", { stream: logger.stream }));
else app.use(morgan("combined", { stream: logger.stream }));

/* -------- Static uploads (local Cloudinary fallback) -------- */
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* -------- SEO / feed endpoints (served at root, not under API prefix) -------- */
app.get("/robots.txt", seoController.robots);
app.get("/sitemap.xml", seoController.sitemap);
app.get("/rss.xml", seoController.rss);

/* -------- API -------- */
app.use(env.apiPrefix, globalLimiter, routes);
app.use(
  `${env.apiPrefix}/docs`,
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, { customSiteTitle: "Shayari API Docs" })
);

app.get("/", (_req, res) =>
  res.json({
    success: true,
    message: "Shayari Platform API",
    docs: `${env.apiPrefix}/docs`,
    health: `${env.apiPrefix}/health`,
  })
);

/* -------- Errors -------- */
app.use(notFound);
app.use(errorHandler);

export default app;
