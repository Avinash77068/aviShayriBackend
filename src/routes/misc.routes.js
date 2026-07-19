import { Router } from "express";
import {
  analyticsController,
  mediaController,
  adController,
  homepageController,
  seoController,
} from "../controllers/misc.controller.js";
import { authenticate } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/rbac.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { ROLES } from "../constants/index.js";

const editorOrAdmin = [authenticate, authorize(ROLES.EDITOR, ROLES.ADMIN)];
const adminOnly = [authenticate, authorize(ROLES.ADMIN)];

/* -------- Analytics (admin/editor) -------- */
const analytics = Router();
analytics.get("/dashboard", ...editorOrAdmin, analyticsController.dashboard);
analytics.get("/views", ...editorOrAdmin, analyticsController.views);
analytics.get("/popular", analyticsController.popular);

/* -------- Media library -------- */
const media = Router();
// Any authenticated user can upload (e.g. an image for a shayari submission).
media.post("/upload", authenticate, upload.single("file"), mediaController.upload);
media.get("/", ...editorOrAdmin, mediaController.list); // library browsing is staff-only
media.delete("/:id", ...editorOrAdmin, mediaController.remove);

/* -------- Ads -------- */
const ads = Router();
ads.get("/", adController.publicList);
ads.get("/admin", ...editorOrAdmin, adController.adminList);
ads.post("/", ...adminOnly, adController.create);
ads.put("/:id", ...adminOnly, adController.update);
ads.delete("/:id", ...adminOnly, adController.remove);
ads.post("/:id/click", adController.click);

/* -------- Homepage sections -------- */
const homepage = Router();
homepage.get("/", homepageController.publicLayout);
homepage.get("/admin", ...editorOrAdmin, homepageController.adminList);
homepage.post("/", ...adminOnly, homepageController.create);
homepage.put("/reorder", ...adminOnly, homepageController.reorder);
homepage.put("/:id", ...adminOnly, homepageController.update);
homepage.delete("/:id", ...adminOnly, homepageController.remove);

/* -------- SEO settings -------- */
const seo = Router();
seo.get("/", ...editorOrAdmin, seoController.get);
seo.put("/", ...adminOnly, seoController.update);

export { analytics, media, ads, homepage, seo };
export { seoController };
